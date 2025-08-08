import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TransactionStatus, TransactionType } from '@/types'
import { CategoryType } from '@prisma/client'

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

    const totalItems = categoryDistribution.reduce((sum, cat) => sum + cat._count.items, 0)

    const categoryData = categoryDistribution.map(category => ({
      categoryName: category.name,
      itemCount: category._count.items,
      percentage: totalItems > 0 ? Math.round((category._count.items / totalItems) * 100) : 0
    }))

    // Get most borrowed items
    const mostBorrowedItems = await prisma.item.findMany({
      where: {
        transactionItems: {
          some: {
            transaction: {
              type: TransactionType.BORROWING
            }
          }
        }
      },
      include: {
        category: true,
        transactionItems: {
          where: {
            transaction: {
              type: TransactionType.BORROWING
            }
          },
          select: {
            quantity: true
          }
        }
      },
      take: 5
    })

    const borrowedItemsData = mostBorrowedItems.map(item => ({
      itemName: item.name,
      borrowCount: item.transactionItems.reduce((sum: number, t: { quantity: number }) => sum + t.quantity, 0),
      categoryName: item.category.name
    })).sort((a, b) => b.borrowCount - a.borrowCount)

    // Get monthly activity trend (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const monthlyTransactions = await prisma.transaction.findMany({
      where: {
        createdAt: { gte: sixMonthsAgo },
        type: {
          in: [TransactionType.BORROWING, TransactionType.REQUEST]
        }
      },
      select: {
        createdAt: true,
        type: true
      }
    })

    // Group by month
    const monthlyData: { [key: string]: { toolsBorrowed: number; materialsConsumed: number } } = {}

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthKey = date.toISOString().slice(0, 7) // YYYY-MM format
      monthlyData[monthKey] = { toolsBorrowed: 0, materialsConsumed: 0 }
    }

    // Count transactions by month and type
    monthlyTransactions.forEach(transaction => {
      const monthKey = transaction.createdAt.toISOString().slice(0, 7)
      if (monthlyData[monthKey]) {
        if (transaction.type === TransactionType.BORROWING) {
          monthlyData[monthKey].toolsBorrowed += 1
        } else if (transaction.type === TransactionType.REQUEST) {
          monthlyData[monthKey].materialsConsumed += 1
        }
      }
    })

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    const monthlyActivityTrendData = Object.entries(monthlyData).map(([monthKey, data]) => {
      const [_year, month] = monthKey.split('-')
      const monthName = monthNames[parseInt(month) - 1]
      return {
        month: monthName,
        toolsBorrowed: data.toolsBorrowed,
        materialsConsumed: data.materialsConsumed
      }
    })

    // Get additional statistics
    const [
      totalBorrowings,
      activeBorrowings,
      overdueBorrowings,
      damagedItems,
      damagedReturnsResult,
      materialsUsedLastMonth,
      lowStockItems
    ] = await Promise.all([
      prisma.transaction.count({ where: { type: TransactionType.BORROWING } }),
      prisma.transaction.count({ where: { status: TransactionStatus.ACTIVE, type: TransactionType.BORROWING } }),
      prisma.transaction.count({
        where: {
          status: TransactionStatus.ACTIVE,
          type: TransactionType.BORROWING,
          expectedReturnDate: { lt: new Date() }
        }
      }),
      prisma.item.count({
        where: { condition: 'DAMAGED' }
      }),
      prisma.transactionItem.aggregate({
        _sum: { damagedQuantity: true },
      }),
      prisma.transactionItem.aggregate({
        where: {
          transaction: {
            type: TransactionType.REQUEST,
            createdAt: {
              gte: new Date(new Date().setDate(new Date().getDate() - 30))
            }
          }
        },
        _sum: {
          quantity: true
        }
      }),
      // Get low stock items
      prisma.item.findMany({
        where: {
          stock: {
            lt: prisma.item.fields.minStock
          }
        },
        select: {
          id: true,
          name: true,
          stock: true,
          minStock: true
        },
        take: 5
      })
    ])

    // Calculate average borrowing duration manually
    const returnedBorrowings = await prisma.transaction.findMany({
      where: {
        status: TransactionStatus.RETURNED,
        type: TransactionType.BORROWING,
        returnDate: { not: null }
      },
      select: {
        createdAt: true,
        returnDate: true
      }
    })

    const avgBorrowingDuration = returnedBorrowings.length > 0
      ? returnedBorrowings.reduce((sum, borrowing) => {
          if (borrowing.returnDate) {
            const duration = Math.ceil((borrowing.returnDate.getTime() - borrowing.createdAt.getTime()) / (1000 * 60 * 60 * 24))
            return sum + duration
          }
          return sum
        }, 0) / returnedBorrowings.length
      : 0

    // Calculate totalTools and totalMaterials
    const totalTools = await prisma.item.count({ where: { category: { type: CategoryType.TOOL } } })
    const totalMaterials = await prisma.item.count({ where: { category: { type: CategoryType.MATERIAL } } })

    const analyticsData = {
      lowStockItems,
      categoryDistribution: categoryData,
      mostBorrowedItems: borrowedItemsData,
      monthlyActivityTrend: monthlyActivityTrendData,
      summary: {
        totalItems,
        totalTools,
        totalMaterials,
        totalBorrowings,
        activeBorrowings,
        overdueBorrowings,
        damagedItems,
        damagedReturns: damagedReturnsResult._sum.damagedQuantity || 0,
        materialsUsedLastMonth: materialsUsedLastMonth._sum.quantity || 0,
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
