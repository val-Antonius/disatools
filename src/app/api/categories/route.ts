import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Ensure default categories exist
async function ensureDefaultCategories() {
  const defaultCategories = [
    { name: 'Materials', type: 'MATERIAL', description: 'Bahan habis pakai untuk keperluan operasional' },
    { name: 'Tools', type: 'TOOL', description: 'Peralatan yang dapat dipinjam dan dikembalikan' }
  ]

  for (const category of defaultCategories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category
    })
  }
}

// GET /api/categories - Get all categories
export async function GET(_request: NextRequest) {
  try {
    // Ensure default categories exist
    await ensureDefaultCategories()

    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { items: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: categories
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

// POST /api/categories - Create new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, description } = body

    if (!name || !type) {
      return NextResponse.json(
        { success: false, error: 'Category name and type are required' },
        { status: 400 }
      )
    }

    // Validate type
    if (type !== 'MATERIAL' && type !== 'TOOL') {
      return NextResponse.json(
        { success: false, error: 'Category type must be MATERIAL or TOOL' },
        { status: 400 }
      )
    }

    // Check if category already exists
    const existingCategory = await prisma.category.findUnique({
      where: { name }
    })

    if (existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Category already exists' },
        { status: 409 }
      )
    }

    const category = await prisma.category.create({
      data: { name, type, description }
    })

    return NextResponse.json({
      success: true,
      data: category,
      message: 'Category created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    )
  }
}
