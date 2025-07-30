import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { BorrowingStatus } from '@/types'

// POST /api/borrowings/[id]/return - Return borrowed items (full or partial)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { notes, items } = body // items: array of {borrowingItemId, returnQuantity}

    // Check if borrowing exists and is active
    const borrowing = await prisma.borrowing.findUnique({
      where: { id },
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

    if (!borrowing) {
      return NextResponse.json(
        { success: false, error: 'Borrowing not found' },
        { status: 404 }
      )
    }

    if (borrowing.status !== BorrowingStatus.ACTIVE) {
      return NextResponse.json(
        { success: false, error: 'Borrowing is not active' },
        { status: 400 }
      )
    }

    // If no specific items provided, return all items
    const itemsToReturn = items || borrowing.items.map(item => ({
      borrowingItemId: item.id,
      returnQuantity: item.quantity - item.returnedQuantity
    }))

    // Validate return quantities
    for (const returnItem of itemsToReturn) {
      const borrowingItem = borrowing.items.find(bi => bi.id === returnItem.borrowingItemId)
      if (!borrowingItem) {
        return NextResponse.json(
          { success: false, error: `Borrowing item ${returnItem.borrowingItemId} not found` },
          { status: 404 }
        )
      }

      const availableToReturn = borrowingItem.quantity - borrowingItem.returnedQuantity
      if (returnItem.returnQuantity > availableToReturn) {
        return NextResponse.json(
          { success: false, error: `Cannot return ${returnItem.returnQuantity} of ${borrowingItem.item.name}. Only ${availableToReturn} available to return.` },
          { status: 400 }
        )
      }
    }

    // Process returns in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const returnedItems = []

      // Process each item return
      for (const returnItem of itemsToReturn) {
        const borrowingItem = borrowing.items.find(bi => bi.id === returnItem.borrowingItemId)!

        // Update borrowing item
        const _updatedBorrowingItem = await tx.borrowingItem.update({
          where: { id: returnItem.borrowingItemId },
          data: {
            returnedQuantity: { increment: returnItem.returnQuantity },
            status: borrowingItem.returnedQuantity + returnItem.returnQuantity >= borrowingItem.quantity
              ? BorrowingStatus.RETURNED
              : BorrowingStatus.ACTIVE
          }
        })

        // Update item stock
        const updatedItem = await tx.item.update({
          where: { id: borrowingItem.itemId },
          data: {
            stock: { increment: returnItem.returnQuantity },
            status: 'AVAILABLE'
          }
        })

        // Log activity
        await tx.activity.create({
          data: {
            type: 'ITEM_RETURNED',
            description: `${returnItem.returnQuantity} unit "${borrowingItem.item.name}" dikembalikan oleh ${borrowing.borrowerName}`,
            itemId: borrowingItem.itemId,
            borrowingId: borrowing.id,
            metadata: {
              borrowerName: borrowing.borrowerName,
              quantity: returnItem.returnQuantity,
              borrowDate: borrowing.borrowDate,
              returnDate: new Date(),
              previousStock: borrowingItem.item.stock,
              newStock: updatedItem.stock,
              isOverdue: new Date() > borrowing.expectedReturnDate,
              isPartialReturn: returnItem.returnQuantity < (borrowingItem.quantity - borrowingItem.returnedQuantity)
            }
          }
        })

        returnedItems.push({
          itemName: borrowingItem.item.name,
          returnedQuantity: returnItem.returnQuantity,
          totalQuantity: borrowingItem.quantity
        })
      }

      // Check if all items are fully returned
      const updatedBorrowingItems = await tx.borrowingItem.findMany({
        where: { borrowingId: id }
      })

      const allItemsReturned = updatedBorrowingItems.every(
        item => item.returnedQuantity >= item.quantity
      )

      // Update main borrowing status if all items returned
      const updatedBorrowing = await tx.borrowing.update({
        where: { id },
        data: {
          status: allItemsReturned ? BorrowingStatus.RETURNED : BorrowingStatus.ACTIVE,
          returnDate: allItemsReturned ? new Date() : null,
          notes: notes || borrowing.notes
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

      return {
        borrowing: updatedBorrowing,
        returnedItems,
        allItemsReturned
      }
    })

    return NextResponse.json({
      success: true,
      data: result,
      message: result.allItemsReturned
        ? 'All items returned successfully'
        : 'Items partially returned successfully'
    })
  } catch (error) {
    console.error('Error returning items:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to return items' },
      { status: 500 }
    )
  }
}
