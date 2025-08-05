import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/frequent-borrowers - Get frequent borrowers for autocomplete
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '10')

    interface WhereClause {
      borrowCount: { gte: number };
      name?: {
        contains: string;
        mode: 'insensitive';
      };
    }

    const where: WhereClause = {
      borrowCount: { gte: 3 } // Show borrowers with 3+ borrowings
    }

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive'
      }
    }

    const frequentBorrowers = await prisma.frequentBorrower.findMany({
      where,
      orderBy: [
        { borrowCount: 'desc' },
        { lastBorrow: 'desc' }
      ],
      take: limit
    })

    return NextResponse.json({
      success: true,
      data: frequentBorrowers
    })
  } catch (error) {
    console.error('Error fetching frequent borrowers:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch frequent borrowers' },
      { status: 500 }
    )
  }
}

// POST /api/frequent-borrowers - Update or create frequent borrower
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, department } = body

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      )
    }

    // Check if borrower already exists
    const existingBorrower = await prisma.frequentBorrower.findUnique({
      where: { name }
    })

    let borrower
    if (existingBorrower) {
      // Update existing borrower
      borrower = await prisma.frequentBorrower.update({
        where: { name },
        data: {
          borrowCount: existingBorrower.borrowCount + 1,
          lastBorrow: new Date(),
          ...(email && { email }),
          ...(phone && { phone }),
          ...(department && { department })
        }
      })
    } else {
      // Create new borrower
      borrower = await prisma.frequentBorrower.create({
        data: {
          name,
          email,
          phone,
          department,
          borrowCount: 1,
          lastBorrow: new Date()
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: borrower,
      message: 'Borrower updated successfully'
    })
  } catch (error) {
    console.error('Error updating borrower:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update borrower' },
      { status: 500 }
    )
  }
}
