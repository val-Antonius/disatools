import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/reports/utilization - Generate utilization report
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const category = searchParams.get('category')
    const utilizationLevel = searchParams.get('utilizationLevel')

    // Get all items with their borrowing history
    const items = await prisma.item.findMany({
      where: category ? {
        category: {
          name: category
        }
      } : undefined,
      include: {
        category: true,
        borrowingItems: {
          where: dateFrom || dateTo ? {
            borrowing: {
              borrowDate: {
                ...(dateFrom && { gte: new Date(dateFrom) }),
                ...(dateTo && { lte: new Date(dateTo) })
              }
            }
          } : undefined,
          include: {
            borrowing: true
          }
        }
      }
    })

    // Calculate utilization metrics for each item
    const utilizationData = items.map(item => {
      const borrowings = item.borrowingItems
      const totalBorrowings = borrowings.length
      
      // Calculate total days borrowed
      const totalDays = borrowings.reduce((sum, borrowingItem) => {
        const borrowDate = new Date(borrowingItem.borrowing.borrowDate)
        const returnDate = borrowingItem.borrowing.returnDate 
          ? new Date(borrowingItem.borrowing.returnDate)
          : new Date() // If not returned yet, use current date
        
        const daysDiff = Math.ceil((returnDate.getTime() - borrowDate.getTime()) / (1000 * 60 * 60 * 24))
        return sum + Math.max(daysDiff, 0)
      }, 0)

      // Calculate average borrow duration
      const averageBorrowDuration = totalBorrowings > 0 ? totalDays / totalBorrowings : 0

      // Calculate utilization rate (days borrowed / total days in period)
      const periodStart = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // Default to 1 year
      const periodEnd = dateTo ? new Date(dateTo) : new Date()
      const totalPeriodDays = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24))
      const utilizationRate = totalPeriodDays > 0 ? totalDays / totalPeriodDays : 0

      // Calculate popularity score (borrowings per month)
      const monthsInPeriod = Math.max(totalPeriodDays / 30, 1)
      const popularityScore = totalBorrowings / monthsInPeriod

      // Calculate ROI (simplified: utilization rate * popularity score)
      const roi = utilizationRate * popularityScore

      // Determine recommendation
      let recommendation = 'Evaluasi'
      if (utilizationRate > 0.8) {
        recommendation = 'Pertahankan'
      } else if (utilizationRate > 0.4) {
        recommendation = 'Tingkatkan'
      } else if (utilizationRate > 0.1) {
        recommendation = 'Evaluasi'
      } else {
        recommendation = 'Pertimbangkan Penghapusan'
      }

      // Get last borrowed date
      const lastBorrowing = borrowings
        .sort((a, b) => new Date(b.borrowing.borrowDate).getTime() - new Date(a.borrowing.borrowDate).getTime())[0]
      const lastBorrowed = lastBorrowing 
        ? lastBorrowing.borrowing.borrowDate.toISOString().split('T')[0]
        : undefined

      return {
        itemId: item.id,
        itemName: item.name,
        category: item.category.name,
        totalBorrowings,
        totalDays,
        utilizationRate: Math.min(utilizationRate, 1), // Cap at 100%
        averageBorrowDuration,
        popularityScore,
        lastBorrowed,
        roi: Math.min(roi, 1), // Cap at 100%
        recommendation
      }
    })

    // Apply utilization level filter
    const filteredData = utilizationData.filter(item => {
      if (!utilizationLevel) return true
      
      switch (utilizationLevel) {
        case 'high':
          return item.utilizationRate > 0.8
        case 'medium':
          return item.utilizationRate >= 0.4 && item.utilizationRate <= 0.8
        case 'low':
          return item.utilizationRate > 0 && item.utilizationRate < 0.4
        case 'unused':
          return item.utilizationRate === 0
        default:
          return true
      }
    })

    // Sort by utilization rate (highest first)
    filteredData.sort((a, b) => b.utilizationRate - a.utilizationRate)

    // Calculate summary statistics
    const totalItems = filteredData.length
    const averageUtilization = totalItems > 0 
      ? filteredData.reduce((sum, item) => sum + item.utilizationRate, 0) / totalItems 
      : 0
    const averagePopularity = totalItems > 0
      ? filteredData.reduce((sum, item) => sum + item.popularityScore, 0) / totalItems
      : 0

    const utilizationDistribution = {
      high: filteredData.filter(item => item.utilizationRate > 0.8).length,
      medium: filteredData.filter(item => item.utilizationRate >= 0.4 && item.utilizationRate <= 0.8).length,
      low: filteredData.filter(item => item.utilizationRate > 0 && item.utilizationRate < 0.4).length,
      unused: filteredData.filter(item => item.utilizationRate === 0).length
    }

    const topPerformers = filteredData
      .filter(item => item.utilizationRate > 0.6)
      .slice(0, 10)

    const underperformers = filteredData
      .filter(item => item.utilizationRate < 0.2)
      .slice(0, 10)

    return NextResponse.json({
      success: true,
      data: filteredData,
      summary: {
        totalItems,
        averageUtilization,
        averagePopularity,
        utilizationDistribution,
        topPerformers: topPerformers.map(item => ({
          itemName: item.itemName,
          category: item.category,
          utilizationRate: item.utilizationRate,
          totalBorrowings: item.totalBorrowings
        })),
        underperformers: underperformers.map(item => ({
          itemName: item.itemName,
          category: item.category,
          utilizationRate: item.utilizationRate,
          totalBorrowings: item.totalBorrowings,
          recommendation: item.recommendation
        })),
        recommendations: {
          maintain: filteredData.filter(item => item.recommendation === 'Pertahankan').length,
          improve: filteredData.filter(item => item.recommendation === 'Tingkatkan').length,
          evaluate: filteredData.filter(item => item.recommendation === 'Evaluasi').length,
          consider_removal: filteredData.filter(item => item.recommendation === 'Pertimbangkan Penghapusan').length
        }
      }
    })

  } catch (error) {
    console.error('Error generating utilization report:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate utilization report' },
      { status: 500 }
    )
  }
}
