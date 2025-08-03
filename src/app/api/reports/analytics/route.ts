import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ItemCondition } from '@/types'

// GET /api/reports/analytics - Generate comprehensive analytics report
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const category = searchParams.get('category')

    // Build date filter
    const dateFilter = dateFrom || dateTo ? {
      borrowDate: {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo && { lte: new Date(dateTo) })
      }
    } : {}

    // Get comprehensive data
    const [
      totalItems,
      totalBorrowings,
      borrowingItems,
      damagedItems
    ] = await Promise.all([
      // Total items count
      prisma.item.count({
        where: category ? {
          category: { name: category }
        } : undefined
      }),

      // Total borrowings count
      prisma.borrowing.count({
        where: {
          ...dateFilter,
          ...(category && {
            items: {
              some: {
                item: {
                  category: { name: category }
                }
              }
            }
          })
        }
      }),

      // All borrowing items for detailed analysis
      prisma.borrowingItem.findMany({
        where: {
          borrowing: dateFilter,
          ...(category && {
            item: {
              category: { name: category }
            }
          })
        },
        include: {
          item: {
            include: {
              category: true
            }
          },
          borrowing: true
        }
      }),

      // Damaged/lost items
      prisma.borrowingItem.findMany({
        where: {
          OR: [
            { condition: ItemCondition.DAMAGED },
            { condition: ItemCondition.LOST },
            { damagedQuantity: { gt: 0 } },
            { lostQuantity: { gt: 0 } }
          ],
          borrowing: dateFilter,
          ...(category && {
            item: {
              category: { name: category }
            }
          })
        },
        include: {
          item: {
            include: {
              category: true
            }
          }
        }
      })
    ])

    // Calculate damage rate
    const totalReturnedItems = borrowingItems.filter(item => item.returnedQuantity > 0).length
    const totalDamagedItems = damagedItems.length
    const damageRate = totalReturnedItems > 0 ? totalDamagedItems / totalReturnedItems : 0

    // Calculate utilization rate (simplified)
    const itemsWithBorrowings = new Set(borrowingItems.map(item => item.itemId)).size
    const utilizationRate = totalItems > 0 ? itemsWithBorrowings / totalItems : 0

    // Calculate cost impact
    const costImpact = damagedItems.reduce((sum, item) => {
      const baseCost = 100000 // Default item cost
      const damagedCost = (item.damagedQuantity || 0) * baseCost * 0.5
      const lostCost = (item.lostQuantity || 0) * baseCost
      return sum + damagedCost + lostCost
    }, 0)

    // Monthly borrowing trends
    const monthlyBorrowings = borrowingItems.reduce((acc, item) => {
      const month = item.borrowing.borrowDate.toISOString().substring(0, 7) // YYYY-MM
      acc[month] = (acc[month] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const monthlyTrend = Object.entries(monthlyBorrowings)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month))

    // Damages by category
    const damagesByCategory = damagedItems.reduce((acc, item) => {
      const categoryName = item.item.category.name
      if (!acc[categoryName]) {
        acc[categoryName] = { count: 0, cost: 0 }
      }
      acc[categoryName].count += 1
      acc[categoryName].cost += 50000 // Estimated cost per damage
      return acc
    }, {} as Record<string, { count: number; cost: number }>)

    // Top damaged items
    const itemDamageCount = damagedItems.reduce((acc, item) => {
      const itemName = item.item.name
      if (!acc[itemName]) {
        acc[itemName] = { count: 0, cost: 0 }
      }
      acc[itemName].count += 1
      acc[itemName].cost += 50000
      return acc
    }, {} as Record<string, { count: number; cost: number }>)

    const topDamagedItems = Object.entries(itemDamageCount)
      .map(([itemName, stats]) => ({
        itemName,
        damageCount: stats.count,
        cost: stats.cost
      }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10)

    // Utilization trends (monthly)
    const utilizationTrends = monthlyTrend.map(trend => ({
      month: trend.month,
      rate: Math.min(trend.count / totalItems, 1) // Simplified utilization rate
    }))

    // Generate insights
    const insights = []

    // High damage rate warning
    if (damageRate > 0.15) {
      insights.push({
        type: 'warning' as const,
        title: 'Tingkat Kerusakan Tinggi',
        description: `Tingkat kerusakan barang mencapai ${(damageRate * 100).toFixed(1)}%, lebih tinggi dari batas normal 15%.`,
        action: 'Pertimbangkan untuk meningkatkan kualitas barang atau memberikan training kepada peminjam.'
      })
    }

    // Low utilization warning
    if (utilizationRate < 0.3) {
      insights.push({
        type: 'warning' as const,
        title: 'Utilisasi Rendah',
        description: `Hanya ${(utilizationRate * 100).toFixed(1)}% barang yang aktif dipinjam.`,
        action: 'Evaluasi kebutuhan inventaris dan pertimbangkan untuk mengurangi stok barang yang jarang digunakan.'
      })
    }

    // High cost impact
    if (costImpact > 1000000) {
      insights.push({
        type: 'warning' as const,
        title: 'Dampak Biaya Tinggi',
        description: `Kerugian akibat kerusakan dan kehilangan mencapai ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(costImpact)}.`,
        action: 'Implementasikan sistem deposit atau asuransi untuk mengurangi risiko finansial.'
      })
    }

    // Positive insights
    if (damageRate < 0.05) {
      insights.push({
        type: 'success' as const,
        title: 'Tingkat Kerusakan Rendah',
        description: `Tingkat kerusakan hanya ${(damageRate * 100).toFixed(1)}%, menunjukkan pengelolaan yang baik.`,
        action: 'Pertahankan standar operasional yang sudah ada.'
      })
    }

    if (utilizationRate > 0.7) {
      insights.push({
        type: 'success' as const,
        title: 'Utilisasi Optimal',
        description: `${(utilizationRate * 100).toFixed(1)}% barang aktif digunakan, menunjukkan efisiensi inventaris yang baik.`,
        action: 'Pertimbangkan untuk menambah stok barang populer.'
      })
    }

    // General recommendations
    insights.push({
      type: 'info' as const,
      title: 'Rekomendasi Umum',
      description: 'Lakukan review berkala terhadap kondisi barang dan pola peminjaman.',
      action: 'Jadwalkan audit inventaris bulanan dan training peminjam.'
    })

    const analyticsData = {
      summary: {
        totalItems,
        totalBorrowings,
        damageRate,
        utilizationRate,
        costImpact
      },
      trends: {
        monthlyBorrowings: monthlyTrend,
        damagesByCategory: Object.entries(damagesByCategory).map(([category, stats]) => ({
          category,
          count: stats.count,
          cost: stats.cost
        })),
        topDamagedItems,
        utilizationTrends
      },
      insights
    }

    return NextResponse.json({
      success: true,
      data: analyticsData
    })

  } catch (error) {
    console.error('Error generating analytics report:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate analytics report' },
      { status: 500 }
    )
  }
}
