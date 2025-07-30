import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/frequent-borrowers - Get frequent borrowers for autocomplete
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '10')

    const where: any = {
      borrowCount: { gte: 2 } // Show borrowers with 2+ borrowings
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
