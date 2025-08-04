import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/analytics - Get analytics data
export async function GET(_request: NextRequest) {
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

    const totalItems = categoryDistribution.reduce((sum: number, cat) => sum + cat._count.items, 0)

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
          select: { borrowingItems: true }
        }
      },
      orderBy: {
        borrowingItems: { _count: 'desc' }
      },
      take: 5
    })

    const borrowedItemsData = mostBorrowedItems.map(item => ({
      itemName: item.name,
      borrowCount: item._count.borrowingItems,
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
      const [_year, month] = monthKey.split('-')
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
      damagedItems,
      damagedReturns
    ] = await Promise.all([
      prisma.borrowing.count(),
      prisma.borrowing.count({ where: { status: 'ACTIVE' } }),
      prisma.borrowing.count({
        where: {
          status: 'ACTIVE',
          expectedReturnDate: { lt: new Date() }
        }
      }),
      // Count items with damaged condition
      prisma.item.count({
        where: { condition: 'DAMAGED' }
      }),
      // Count borrowing items returned with damaged condition
      prisma.borrowingItem.count({
        where: {
          condition: 'DAMAGED',
          status: 'RETURNED'
        }
      })
    ])

    // Calculate average borrowing duration manually
    const returnedBorrowings = await prisma.borrowing.findMany({
      where: {
        status: 'RETURNED',
        returnDate: { not: null }
      },
      select: {
        borrowDate: true,
        returnDate: true
      }
    })

    const avgBorrowingDuration = returnedBorrowings.length > 0
      ? returnedBorrowings.reduce((sum, borrowing) => {
          if (borrowing.returnDate) {
            const duration = Math.ceil((borrowing.returnDate.getTime() - borrowing.borrowDate.getTime()) / (1000 * 60 * 60 * 24))
            return sum + duration
          }
          return sum
        }, 0) / returnedBorrowings.length
      : 0

    const analyticsData = {
      categoryDistribution: categoryData,
      mostBorrowedItems: borrowedItemsData,
      monthlyBorrowingTrend: monthlyTrendData,
      summary: {
        totalItems,
        totalBorrowings,
        activeBorrowings,
        overdueBorrowings,
        damagedItems,
        damagedReturns,
        avgBorrowingDuration: Math.round(avgBorrowingDuration * 100) / 100,
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
