import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ItemStatus } from '@/types'

// GET /api/items - Get all items with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const categoryId = searchParams.get('categoryId')
    const locationId = searchParams.get('locationId')
    const status = searchParams.get('status') as ItemStatus
    const lowStock = searchParams.get('lowStock') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { name: { contains: search, mode: 'insensitive' } } },
        { location: { name: { contains: search, mode: 'insensitive' } } }
      ]
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (locationId) {
      where.locationId = locationId
    }

    if (status) {
      where.status = status
    }

    if (lowStock) {
      where.stock = { lte: prisma.item.fields.minStock }
    }

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        include: {
          category: true,
          location: true,
          _count: {
            select: { borrowings: true }
          }
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.item.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching items:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch items' },
      { status: 500 }
    )
  }
}

// POST /api/items - Create new item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, stock, minStock, categoryId, locationId } = body

    // Validate required fields
    if (!name || !categoryId || !locationId || stock === undefined || minStock === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if category and location exist
    const [category, location] = await Promise.all([
      prisma.category.findUnique({ where: { id: categoryId } }),
      prisma.location.findUnique({ where: { id: locationId } })
    ])

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }

    if (!location) {
      return NextResponse.json(
        { success: false, error: 'Location not found' },
        { status: 404 }
      )
    }

    // Determine status based on stock
    const status = stock > 0 ? ItemStatus.AVAILABLE : ItemStatus.OUT_OF_STOCK

    const item = await prisma.item.create({
      data: {
        name,
        description,
        stock: parseInt(stock),
        minStock: parseInt(minStock),
        status,
        categoryId,
        locationId
      },
      include: {
        category: true,
        location: true
      }
    })

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'ITEM_ADDED',
        description: `Item "${name}" ditambahkan ke inventaris`,
        itemId: item.id,
        metadata: { stock, category: category.name, location: location.name }
      }
    })

    return NextResponse.json({
      success: true,
      data: item,
      message: 'Item created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create item' },
      { status: 500 }
    )
  }
}
