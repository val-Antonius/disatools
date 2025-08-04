import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TransactionType, TransactionStatus, ActivityType, CategoryType } from '@/types'

// GET /api/transactions - Get all transactions with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as TransactionType | null
    const status = searchParams.get('status') as TransactionStatus | null
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const search = searchParams.get('search')

    const where: any = {}

    if (type) {
      where.type = type
    }

    if (status) {
      where.status = status
    }

    if (dateFrom || dateTo) {
      where.transactionDate = {}
      if (dateFrom) {
        where.transactionDate.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.transactionDate.lte = new Date(dateTo)
      }
    }

    if (search) {
      where.OR = [
        { requesterName: { contains: search, mode: 'insensitive' } },
        { purpose: { contains: search, mode: 'insensitive' } },
        {
          items: {
            some: {
              item: {
                name: { contains: search, mode: 'insensitive' }
              }
            }
          }
        }
      ]
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        items: {
          include: {
            item: {
              include: {
                category: true,
                location: true
              }
            }
          }
        }
      },
      orderBy: { transactionDate: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: transactions
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}

// POST /api/transactions - Create new transaction (material request or tool borrowing)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      requesterName, 
      purpose, 
      type, 
      expectedReturnDate, 
      notes, 
      items 
    } = body

    if (!requesterName || !purpose || !type || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate items and check stock
    const itemIds = items.map((item: any) => item.itemId)
    const dbItems = await prisma.item.findMany({
      where: { id: { in: itemIds } },
      include: { category: true }
    })

    if (dbItems.length !== itemIds.length) {
      return NextResponse.json(
        { success: false, error: 'Some items not found' },
        { status: 404 }
      )
    }

    // Validate type consistency
    const isMaterialRequest = type === TransactionType.REQUEST
    const isToolBorrowing = type === TransactionType.BORROWING

    for (const dbItem of dbItems) {
      const requestedItem = items.find((item: any) => item.itemId === dbItem.id)
      
      if (isMaterialRequest && dbItem.category.type !== CategoryType.MATERIAL) {
        return NextResponse.json(
          { success: false, error: `Item ${dbItem.name} is not a material` },
          { status: 400 }
        )
      }

      if (isToolBorrowing && dbItem.category.type !== CategoryType.TOOL) {
        return NextResponse.json(
          { success: false, error: `Item ${dbItem.name} is not a tool` },
          { status: 400 }
        )
      }

      if (dbItem.stock < requestedItem.quantity) {
        return NextResponse.json(
          { success: false, error: `Insufficient stock for ${dbItem.name}` },
          { status: 400 }
        )
      }
    }

    // For tool borrowing, expectedReturnDate is required
    if (isToolBorrowing && !expectedReturnDate) {
      return NextResponse.json(
        { success: false, error: 'Expected return date is required for tool borrowing' },
        { status: 400 }
      )
    }

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        type,
        requesterName,
        purpose,
        expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null,
        consumedDate: isMaterialRequest ? new Date() : null,
        status: isMaterialRequest ? TransactionStatus.CONSUMED : TransactionStatus.ACTIVE,
        notes,
        items: {
          create: items.map((item: any) => ({
            itemId: item.itemId,
            quantity: item.quantity,
            consumedQuantity: isMaterialRequest ? item.quantity : 0,
            status: isMaterialRequest ? TransactionStatus.CONSUMED : TransactionStatus.ACTIVE,
            notes: item.notes
          }))
        }
      },
      include: {
        items: {
          include: {
            item: {
              include: {
                category: true,
                location: true
              }
            }
          }
        }
      }
    })

    // Update stock for all items
    for (const item of items) {
      await prisma.item.update({
        where: { id: item.itemId },
        data: {
          stock: {
            decrement: item.quantity
          }
        }
      })
    }

    // Create activity log
    await prisma.activity.create({
      data: {
        type: isMaterialRequest ? ActivityType.MATERIAL_REQUESTED : ActivityType.ITEM_BORROWED,
        description: isMaterialRequest 
          ? `Material requested by ${requesterName}: ${items.map((i: any) => dbItems.find(di => di.id === i.itemId)?.name).join(', ')}`
          : `Tools borrowed by ${requesterName}: ${items.map((i: any) => dbItems.find(di => di.id === i.itemId)?.name).join(', ')}`,
        transactionId: transaction.id,
        metadata: {
          requesterName,
          purpose,
          itemCount: items.length,
          totalQuantity: items.reduce((sum: number, item: any) => sum + item.quantity, 0)
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: transaction,
      message: isMaterialRequest ? 'Material request created successfully' : 'Tool borrowing created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create transaction' },
      { status: 500 }
    )
  }
}
