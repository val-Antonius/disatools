import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ItemStatus } from '@/types'

// GET /api/items/[id] - Get single item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        category: true,
        location: true,
        borrowingItems: {
          where: { status: 'ACTIVE' },
          include: {
            borrowing: {
              select: {
                borrowerName: true,
                purpose: true,
                borrowDate: true,
                expectedReturnDate: true
              }
            }
          }
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: item
    })
  } catch (error) {
    console.error('Error fetching item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch item' },
      { status: 500 }
    )
  }
}

// PUT /api/items/[id] - Update item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, stock, minStock, categoryId, locationId, status } = body

    // Check if item exists
    const existingItem = await prisma.item.findUnique({
      where: { id },
      include: { category: true, location: true }
    })

    if (!existingItem) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      )
    }

    // Validate category and location if provided
    if (categoryId && categoryId !== existingItem.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: categoryId } })
      if (!category) {
        return NextResponse.json(
          { success: false, error: 'Category not found' },
          { status: 404 }
        )
      }
    }

    if (locationId && locationId !== existingItem.locationId) {
      const location = await prisma.location.findUnique({ where: { id: locationId } })
      if (!location) {
        return NextResponse.json(
          { success: false, error: 'Location not found' },
          { status: 404 }
        )
      }
    }

    // Determine status if stock is updated
    let finalStatus = status
    if (stock !== undefined && !status) {
      finalStatus = parseInt(stock) > 0 ? ItemStatus.AVAILABLE : ItemStatus.OUT_OF_STOCK
    }

    const updatedItem = await prisma.item.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(stock !== undefined && { stock: parseInt(stock) }),
        ...(minStock !== undefined && { minStock: parseInt(minStock) }),
        ...(categoryId && { categoryId }),
        ...(locationId && { locationId }),
        ...(finalStatus && { status: finalStatus })
      },
      include: {
        category: true,
        location: true
      }
    })

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'ITEM_UPDATED',
        description: `Item "${updatedItem.name}" diperbarui`,
        itemId: updatedItem.id,
        metadata: {
          changes: body,
          previousStock: existingItem.stock,
          newStock: updatedItem.stock
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedItem,
      message: 'Item updated successfully'
    })
  } catch (error) {
    console.error('Error updating item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update item' },
      { status: 500 }
    )
  }
}

// DELETE /api/items/[id] - Delete item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Check if item exists
    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        borrowingItems: {
          where: { status: 'ACTIVE' }
        }
      }
    })

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      )
    }

    // Check if item has active borrowings
    if (item.borrowingItems.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete item with active borrowings' },
        { status: 400 }
      )
    }

    await prisma.item.delete({
      where: { id }
    })

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'ITEM_DELETED',
        description: `Item "${item.name}" dihapus dari inventaris`,
        metadata: {
          itemName: item.name,
          category: item.categoryId,
          location: item.locationId
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Item deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete item' },
      { status: 500 }
    )
  }
}
