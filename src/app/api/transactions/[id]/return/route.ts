import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TransactionStatus, ActivityType, ItemCondition, TransactionType } from '@/types'

// POST /api/transactions/[id]/return - Return tools from a borrowing transaction
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: transactionId } = await params
    const body = await request.json()
    const { items, notes } = body

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No items to return' },
        { status: 400 }
      )
    }

    // Get transaction details
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        items: {
          include: {
            item: true
          }
        }
      }
    })

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      )
    }

    if (transaction.type !== TransactionType.BORROWING) {
      return NextResponse.json(
        { success: false, error: 'Only borrowing transactions can be returned' },
        { status: 400 }
      )
    }

    if (transaction.status !== TransactionStatus.ACTIVE && transaction.status !== TransactionStatus.OVERDUE) {
      return NextResponse.json(
        { success: false, error: 'Transaction is not active' },
        { status: 400 }
      )
    }

    // Validate return items
    for (const returnItem of items) {
      const transactionItem = transaction.items.find(ti => ti.id === returnItem.transactionItemId)
      
      if (!transactionItem) {
        return NextResponse.json(
          { success: false, error: `Transaction item ${returnItem.transactionItemId} not found` },
          { status: 404 }
        )
      }

      const totalReturning = returnItem.returnQuantity + returnItem.damagedQuantity + returnItem.lostQuantity
      const maxReturn = transactionItem.quantity - transactionItem.returnedQuantity

      if (totalReturning > maxReturn) {
        return NextResponse.json(
          { success: false, error: `Cannot return more than borrowed for item ${transactionItem.item.name}` },
          { status: 400 }
        )
      }
    }

    // Process returns
    let allItemsReturned = true
    const returnedItems = []

    for (const returnItem of items) {
      const transactionItem = transaction.items.find(ti => ti.id === returnItem.transactionItemId)
      if (!transactionItem) continue

      const newReturnedQuantity = transactionItem.returnedQuantity + returnItem.returnQuantity + returnItem.damagedQuantity + returnItem.lostQuantity
      const isFullyReturned = newReturnedQuantity >= transactionItem.quantity

      // Update transaction item
      await prisma.transactionItem.update({
        where: { id: returnItem.transactionItemId },
        data: {
          returnedQuantity: newReturnedQuantity,
          damagedQuantity: transactionItem.damagedQuantity + returnItem.damagedQuantity,
          lostQuantity: transactionItem.lostQuantity + returnItem.lostQuantity,
          status: isFullyReturned ? TransactionStatus.RETURNED : TransactionStatus.ACTIVE,
          condition: returnItem.condition || ItemCondition.GOOD,
          returnNotes: returnItem.returnNotes
        }
      })

      // Update item stock (return good items to stock)
      await prisma.item.update({
        where: { id: transactionItem.itemId },
        data: {
          stock: {
            increment: returnItem.returnQuantity // Only good items go back to stock
          }
        }
      })

      returnedItems.push({
        itemName: transactionItem.item.name,
        returnedQuantity: returnItem.returnQuantity,
        damagedQuantity: returnItem.damagedQuantity,
        lostQuantity: returnItem.lostQuantity,
        condition: returnItem.condition
      })

      if (!isFullyReturned) {
        allItemsReturned = false
      }
    }

    // Update transaction status if all items are returned
    if (allItemsReturned) {
      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: TransactionStatus.RETURNED,
          returnDate: new Date(),
          notes: notes ? `${transaction.notes || ''}\n\nReturn notes: ${notes}` : transaction.notes
        }
      })
    }

    // Create activity log
    await prisma.activity.create({
      data: {
        type: ActivityType.ITEM_RETURNED,
        description: `Tools returned by ${transaction.requesterName}: ${returnedItems.map(item => 
          `${item.itemName} (${item.returnedQuantity} good, ${item.damagedQuantity} damaged, ${item.lostQuantity} lost)`
        ).join(', ')}`,
        transactionId: transaction.id,
        metadata: {
          returnedItems,
          returnNotes: notes,
          allItemsReturned,
          returnDate: new Date().toISOString()
        }
      }
    })

    // Log damaged/lost items separately
    for (const returnItem of returnedItems) {
      if (returnItem.damagedQuantity > 0) {
        await prisma.activity.create({
          data: {
            type: ActivityType.ITEM_DAMAGED,
            description: `${returnItem.damagedQuantity} units of ${returnItem.itemName} returned damaged`,
            transactionId: transaction.id,
            metadata: {
              itemName: returnItem.itemName,
              quantity: returnItem.damagedQuantity,
              condition: returnItem.condition,
              returnDate: new Date().toISOString()
            }
          }
        })
      }

      if (returnItem.lostQuantity > 0) {
        await prisma.activity.create({
          data: {
            type: ActivityType.ITEM_LOST,
            description: `${returnItem.lostQuantity} units of ${returnItem.itemName} reported lost`,
            transactionId: transaction.id,
            metadata: {
              itemName: returnItem.itemName,
              quantity: returnItem.lostQuantity,
              returnDate: new Date().toISOString()
            }
          }
        })
      }
    }

    // Get updated transaction
    const updatedTransaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
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

    return NextResponse.json({
      success: true,
      data: updatedTransaction,
      message: allItemsReturned ? 'All tools returned successfully' : 'Partial return completed'
    })

  } catch (error) {
    console.error('Error returning tools:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to return tools' },
      { status: 500 }
    )
  }
}
