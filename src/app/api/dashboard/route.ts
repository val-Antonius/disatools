import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/dashboard - Get dashboard KPI data
export async function GET(_request: NextRequest) {
  try {
    // Get current date for overdue calculation
    const now = new Date()

    // Fetch all KPI data in parallel
    const [
      totalItems,
      lowStockItems,
      totalBorrowedItems,
      overdueItems,
      recentActivities,
      categoryStats,
      locationStats
    ] = await Promise.all([
      // Total unique items (not stock count)
      prisma.item.count(),

      // Items with stock <= minStock
      prisma.item.count({
        where: {
          OR: [
            { stock: { lte: prisma.item.fields.minStock } },
            { status: 'OUT_OF_STOCK' }
          ]
        }
      }),

      // Total quantity of items currently borrowed
      prisma.borrowingItem.aggregate({
        where: { status: 'ACTIVE' },
        _sum: { quantity: true }
      }),

      // Overdue borrowings
      prisma.borrowing.count({
        where: {
          status: 'ACTIVE',
          expectedReturnDate: { lt: now }
        }
      }),

      // Recent activities (last 10)
      prisma.activity.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          item: {
            select: { name: true }
          },
          borrowing: {
            select: { borrowerName: true }
          }
        }
      }),

      // Category with most items
      prisma.category.findFirst({
        include: {
          _count: {
            select: { items: true }
          }
        },
        orderBy: {
          items: { _count: 'desc' }
        }
      }),

      // Location with most items
      prisma.location.findFirst({
        include: {
          _count: {
            select: { items: true }
          }
        },
        orderBy: {
          items: { _count: 'desc' }
        }
      })
    ])

    // Get today's borrowings and returns
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)

    const [todayBorrowings, todayReturns] = await Promise.all([
      prisma.borrowing.count({
        where: {
          borrowDate: {
            gte: startOfDay,
            lt: endOfDay
          }
        }
      }),

      prisma.borrowing.count({
        where: {
          returnDate: {
            gte: startOfDay,
            lt: endOfDay
          }
        }
      })
    ])

    // Format response
    const dashboardData = {
      kpi: {
        totalItems,
        lowStockItems,
        totalBorrowedItems: totalBorrowedItems._sum.quantity || 0,
        overdueItems
      },
      recentActivities: recentActivities.map(activity => ({
        id: activity.id,
        type: activity.type,
        description: activity.description,
        timestamp: activity.createdAt,
        itemName: activity.item?.name,
        borrowerName: activity.borrowing?.borrowerName
      })),
      quickStats: {
        topCategory: categoryStats ? {
          name: categoryStats.name,
          count: categoryStats._count.items
        } : null,
        topLocation: locationStats ? {
          name: locationStats.name,
          count: locationStats._count.items
        } : null,
        todayBorrowings,
        todayReturns
      }
    }

    return NextResponse.json({
      success: true,
      data: dashboardData
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
