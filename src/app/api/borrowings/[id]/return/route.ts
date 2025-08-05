import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { BorrowingStatus, ItemCondition } from '@/types'

// POST /api/borrowings/[id]/return - Return borrowed items (full or partial)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { notes, items } = body // items: array of {borrowingItemId, returnQuantity, damagedQuantity, lostQuantity, condition, returnNotes}

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
      returnQuantity: item.quantity - item.returnedQuantity,
      damagedQuantity: 0,
      lostQuantity: 0,
      condition: ItemCondition.GOOD,
      returnNotes: ''
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
      const totalReturning = (returnItem.returnQuantity || 0) + (returnItem.damagedQuantity || 0) + (returnItem.lostQuantity || 0)

      if (totalReturning > availableToReturn) {
        return NextResponse.json(
          { success: false, error: `Cannot return ${totalReturning} of ${borrowingItem.item.name}. Only ${availableToReturn} available to return.` },
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
        const totalReturning = (returnItem.returnQuantity || 0) + (returnItem.damagedQuantity || 0) + (returnItem.lostQuantity || 0)

        // Update borrowing item with condition tracking
        const _updatedBorrowingItem = await tx.borrowingItem.update({
          where: { id: returnItem.borrowingItemId },
          data: {
            returnedQuantity: { increment: totalReturning },
            damagedQuantity: { increment: returnItem.damagedQuantity || 0 },
            lostQuantity: { increment: returnItem.lostQuantity || 0 },
            condition: returnItem.condition || ItemCondition.GOOD,
            returnNotes: returnItem.returnNotes || null,
            status: borrowingItem.returnedQuantity + totalReturning >= borrowingItem.quantity
              ? BorrowingStatus.RETURNED
              : BorrowingStatus.ACTIVE
          }
        })

        // Update item stock and condition
        const goodItemsReturned = returnItem.returnQuantity || 0
        const damagedItemsReturned = returnItem.damagedQuantity || 0
        const _lostItemsReturned = returnItem.lostQuantity || 0

        // Update item stock (only good items go back to stock)
        if (goodItemsReturned > 0) {
          await tx.item.update({
            where: { id: borrowingItem.itemId },
            data: {
              stock: { increment: goodItemsReturned },
              status: 'AVAILABLE'
            }
          })
        }

        // If any items are damaged, update the item's condition to DAMAGED
        if (damagedItemsReturned > 0 || returnItem.condition === ItemCondition.DAMAGED) {
          await tx.item.update({
            where: { id: borrowingItem.itemId },
            data: {
              condition: ItemCondition.DAMAGED
            }
          })
        }

        // Log return activity
        await tx.activity.create({
          data: {
            type: 'ITEM_RETURNED',
            description: `${totalReturning} unit "${borrowingItem.item.name}" dikembalikan oleh ${borrowing.borrowerName}`,
            itemId: borrowingItem.itemId,
            borrowingId: borrowing.id,
            metadata: {
              borrowerName: borrowing.borrowerName,
              returnQuantity: returnItem.returnQuantity || 0,
              damagedQuantity: returnItem.damagedQuantity || 0,
              lostQuantity: returnItem.lostQuantity || 0,
              condition: returnItem.condition || ItemCondition.GOOD,
              returnNotes: returnItem.returnNotes || '',
              borrowDate: borrowing.borrowDate,
              returnDate: new Date(),
              isOverdue: new Date() > borrowing.expectedReturnDate,
              isPartialReturn: totalReturning < (borrowingItem.quantity - borrowingItem.returnedQuantity)
            }
          }
        })

        // Log damaged items if any
        if (returnItem.damagedQuantity && returnItem.damagedQuantity > 0) {
          await tx.activity.create({
            data: {
              type: 'ITEM_DAMAGED',
              description: `${returnItem.damagedQuantity} unit "${borrowingItem.item.name}" dikembalikan dalam kondisi rusak`,
              itemId: borrowingItem.itemId,
              borrowingId: borrowing.id,
              metadata: {
                borrowerName: borrowing.borrowerName,
                damagedQuantity: returnItem.damagedQuantity,
                condition: returnItem.condition,
                returnNotes: returnItem.returnNotes || '',
                returnDate: new Date()
              }
            }
          })
        }

        // Log lost items if any
        if (returnItem.lostQuantity && returnItem.lostQuantity > 0) {
          await tx.activity.create({
            data: {
              type: 'ITEM_LOST',
              description: `${returnItem.lostQuantity} unit "${borrowingItem.item.name}" dilaporkan hilang`,
              itemId: borrowingItem.itemId,
              borrowingId: borrowing.id,
              metadata: {
                borrowerName: borrowing.borrowerName,
                lostQuantity: returnItem.lostQuantity,
                condition: returnItem.condition,
                returnNotes: returnItem.returnNotes || '',
                returnDate: new Date()
              }
            }
          })
        }

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
