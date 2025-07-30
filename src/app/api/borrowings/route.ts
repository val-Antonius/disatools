import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { BorrowingStatus } from '@/types'

// GET /api/borrowings - Get all borrowings with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status') as BorrowingStatus
    const itemId = searchParams.get('itemId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    interface WhereClause {
      OR?: Array<{
        borrowerName?: { contains: string; mode: 'insensitive' };
        purpose?: { contains: string; mode: 'insensitive' };
        item?: { name: { contains: string; mode: 'insensitive' } };
      }>;
      status?: BorrowingStatus;
      itemId?: string;
      borrowDate?: {
        gte?: Date;
        lte?: Date;
      };
    }

    const where: WhereClause = {}

    if (search) {
      where.OR = [
        { borrowerName: { contains: search, mode: 'insensitive' } },
        { purpose: { contains: search, mode: 'insensitive' } },
        { item: { name: { contains: search, mode: 'insensitive' } } }
      ]
    }

    if (status && Object.values(BorrowingStatus).includes(status)) {
      where.status = status
    }

    if (itemId) {
      where.itemId = itemId
    }

    if (dateFrom) {
      where.borrowDate = { gte: new Date(dateFrom) }
    }

    if (dateTo) {
      if (where.borrowDate) {
        where.borrowDate.lte = new Date(dateTo)
      } else {
        where.borrowDate = { lte: new Date(dateTo) }
      }
    }

    const [borrowings, total] = await Promise.all([
      prisma.borrowing.findMany({
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
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.borrowing.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: borrowings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching borrowings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch borrowings' },
      { status: 500 }
    )
  }
}

// POST /api/borrowings - Create new borrowing (multi-item)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { borrowerName, purpose, expectedReturnDate, notes, items } = body

    // Validate required fields
    if (!borrowerName || !purpose || !expectedReturnDate || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields or no items provided' },
        { status: 400 }
      )
    }

    // Validate each item and check stock
    const itemValidations = await Promise.all(
      items.map(async (borrowItem: { itemId: string; quantity: number; notes?: string }) => {
        const { itemId, quantity } = borrowItem

        if (!itemId || !quantity || quantity <= 0) {
          throw new Error('Invalid item data')
        }

        const item = await prisma.item.findUnique({
          where: { id: itemId },
          include: { category: true }
        })

        if (!item) {
          throw new Error(`Item with ID ${itemId} not found`)
        }

        if (item.stock < quantity) {
          throw new Error(`Insufficient stock for ${item.name}. Available: ${item.stock}, Requested: ${quantity}`)
        }

        return { item, quantity }
      })
    )

    // Create borrowing with multiple items in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create main borrowing record
      const borrowing = await tx.borrowing.create({
        data: {
          borrowerName,
          purpose,
          expectedReturnDate: new Date(expectedReturnDate),
          notes,
          status: BorrowingStatus.ACTIVE
        }
      })

      // Create borrowing items and update stock
      const _borrowingItems = await Promise.all(
        itemValidations.map(async ({ item, quantity }) => {
          // Create borrowing item
          const borrowingItem = await tx.borrowingItem.create({
            data: {
              borrowingId: borrowing.id,
              itemId: item.id,
              quantity,
              status: BorrowingStatus.ACTIVE,
              notes: items.find((i: { itemId: string; quantity: number; notes?: string }) => i.itemId === item.id)?.notes
            }
          })

          // Update item stock
          await tx.item.update({
            where: { id: item.id },
            data: {
              stock: { decrement: quantity },
              status: item.stock - quantity === 0 ? 'OUT_OF_STOCK' : item.status
            }
          })

          // Log activity for each item
          await tx.activity.create({
            data: {
              type: 'ITEM_BORROWED',
              description: `${quantity} unit "${item.name}" dipinjam oleh ${borrowerName}`,
              itemId: item.id,
              borrowingId: borrowing.id,
              metadata: {
                borrowerName,
                purpose,
                quantity,
                expectedReturnDate,
                previousStock: item.stock,
                newStock: item.stock - quantity
              }
            }
          })

          return borrowingItem
        })
      )

      // Update or create frequent borrower
      await tx.frequentBorrower.upsert({
        where: { name: borrowerName },
        update: {
          borrowCount: { increment: 1 },
          lastBorrow: new Date()
        },
        create: {
          name: borrowerName,
          borrowCount: 1,
          lastBorrow: new Date()
        }
      })

      // Return borrowing with items
      return await tx.borrowing.findUnique({
        where: { id: borrowing.id },
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
    })

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Multi-item borrowing created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating borrowing:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create borrowing' },
      { status: 500 }
    )
  }
}
