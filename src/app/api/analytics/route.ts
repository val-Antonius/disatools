import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/analytics - Get analytics data
export async function GET(request: NextRequest) {
  try {
    // Get category distribution
    const categoryDistribution = await prisma.category.findMany({
      include: {
        _count: {
          select: { items: true }
        }
      },
      orderBy: {
        items: { _count: 'desc' }
      }
    })

    const totalItems = categoryDistribution.reduce((sum, cat) => sum + cat._count.items, 0)

    const categoryData = categoryDistribution.map(category => ({
      categoryName: category.name,
      itemCount: category._count.items,
      percentage: totalItems > 0 ? Math.round((category._count.items / totalItems) * 100) : 0
    }))

    // Get most borrowed items
    const mostBorrowedItems = await prisma.item.findMany({
      include: {
        category: true,
        _count: {
          select: { borrowings: true }
        }
      },
      orderBy: {
        borrowings: { _count: 'desc' }
      },
      take: 5
    })

    const borrowedItemsData = mostBorrowedItems.map(item => ({
      itemName: item.name,
      borrowCount: item._count.borrowings,
      categoryName: item.category.name
    }))

    // Get monthly borrowing trend (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const monthlyBorrowings = await prisma.borrowing.groupBy({
      by: ['borrowDate'],
      where: {
        borrowDate: { gte: sixMonthsAgo }
      },
      _count: { id: true }
    })

    const monthlyReturns = await prisma.borrowing.groupBy({
      by: ['returnDate'],
      where: {
        returnDate: { 
          gte: sixMonthsAgo,
          not: null
        }
      },
      _count: { id: true }
    })

    // Group by month
    const monthlyData: { [key: string]: { borrowCount: number; returnCount: number } } = {}
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthKey = date.toISOString().slice(0, 7) // YYYY-MM format
      monthlyData[monthKey] = { borrowCount: 0, returnCount: 0 }
    }

    // Count borrowings by month
    monthlyBorrowings.forEach(item => {
      const monthKey = item.borrowDate.toISOString().slice(0, 7)
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].borrowCount += item._count.id
      }
    })

    // Count returns by month
    monthlyReturns.forEach(item => {
      if (item.returnDate) {
        const monthKey = item.returnDate.toISOString().slice(0, 7)
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].returnCount += item._count.id
        }
      }
    })

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    const monthlyTrendData = Object.entries(monthlyData).map(([monthKey, data]) => {
      const [year, month] = monthKey.split('-')
      const monthName = monthNames[parseInt(month) - 1]
      return {
        month: monthName,
        borrowCount: data.borrowCount,
        returnCount: data.returnCount
      }
    })

    // Get additional statistics
    const [
      totalBorrowings,
      activeBorrowings,
      overdueBorrowings,
      avgBorrowingDuration
    ] = await Promise.all([
      prisma.borrowing.count(),
      prisma.borrowing.count({ where: { status: 'ACTIVE' } }),
      prisma.borrowing.count({ 
        where: { 
          status: 'ACTIVE',
          expectedReturnDate: { lt: new Date() }
        }
      }),
      prisma.borrowing.aggregate({
        where: { 
          status: 'RETURNED',
          returnDate: { not: null }
        },
        _avg: {
          // This would need a computed field for duration
          // For now, we'll calculate it differently
        }
      })
    ])

    const analyticsData = {
      categoryDistribution: categoryData,
      mostBorrowedItems: borrowedItemsData,
      monthlyBorrowingTrend: monthlyTrendData,
      summary: {
        totalItems,
        totalBorrowings,
        activeBorrowings,
        overdueBorrowings,
        returnRate: totalBorrowings > 0 ? Math.round(((totalBorrowings - activeBorrowings) / totalBorrowings) * 100) : 0
      }
    }

    return NextResponse.json({
      success: true,
      data: analyticsData
    })
  } catch (error) {
    console.error('Error fetching analytics data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}
