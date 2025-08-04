import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/reports/comprehensive - Get comprehensive report combining conditions, damage, and utilization
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    // Build date filter
    const dateFilter: any = {}
    if (dateFrom || dateTo) {
      dateFilter.createdAt = {}
      if (dateFrom) {
        dateFilter.createdAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        dateFilter.createdAt.lte = new Date(dateTo)
      }
    }

    // Get all items with their transaction history
    const items = await prisma.item.findMany({
      where: dateFilter,
      include: {
        category: true,
        location: true,
        transactionItems: {
          include: {
            transaction: true
          }
        },
        borrowingItems: {
          include: {
            borrowing: true
          }
        }
      }
    })

    // Calculate comprehensive metrics for each item
    const comprehensiveData = items.map(item => {
      // Calculate utilization metrics
      const totalTransactions = item.transactionItems.length + item.borrowingItems.length
      const totalBorrowDays = item.transactionItems
        .filter(ti => ti.transaction.type === 'BORROWING' && ti.transaction.returnDate)
        .reduce((sum, ti) => {
          const borrowDate = new Date(ti.transaction.transactionDate)
          const returnDate = new Date(ti.transaction.returnDate!)
          const days = Math.ceil((returnDate.getTime() - borrowDate.getTime()) / (1000 * 60 * 60 * 24))
          return sum + days
        }, 0)

      const averageBorrowDuration = totalTransactions > 0 ? totalBorrowDays / totalTransactions : 0
      const utilizationRate = totalTransactions > 0 ? Math.min((totalTransactions / 30) * 100, 100) : 0 // Assume 30 is max expected usage

      // Calculate damage metrics
      const totalDamaged = item.transactionItems.reduce((sum, ti) => sum + ti.damagedQuantity, 0) +
                          item.borrowingItems.reduce((sum, bi) => sum + bi.damagedQuantity, 0)
      const totalLost = item.transactionItems.reduce((sum, ti) => sum + ti.lostQuantity, 0) +
                       item.borrowingItems.reduce((sum, bi) => sum + bi.lostQuantity, 0)
      const totalReturned = item.transactionItems.reduce((sum, ti) => sum + ti.returnedQuantity, 0) +
                           item.borrowingItems.reduce((sum, bi) => sum + bi.returnedQuantity, 0)

      const damageRate = totalReturned > 0 ? (totalDamaged / totalReturned) * 100 : 0
      const lossRate = totalReturned > 0 ? (totalLost / totalReturned) * 100 : 0

      // Determine condition status
      let conditionStatus = 'GOOD'
      if (damageRate > 20 || lossRate > 10) {
        conditionStatus = 'POOR'
      } else if (damageRate > 10 || lossRate > 5) {
        conditionStatus = 'FAIR'
      }

      // Determine maintenance need
      const maintenanceNeeded = damageRate > 15 || lossRate > 8 || item.stock <= item.minStock

      // Calculate estimated costs (dummy calculation)
      const estimatedItemValue = 100000 // Default value in IDR
      const totalLossValue = totalLost * estimatedItemValue
      const totalDamageValue = totalDamaged * estimatedItemValue * 0.5 // Assume 50% value loss for damaged items

      // Determine recommendation
      let recommendation = 'MAINTAIN'
      if (utilizationRate < 20) {
        recommendation = 'CONSIDER_DISPOSAL'
      } else if (utilizationRate > 80 && damageRate < 10) {
        recommendation = 'INCREASE_STOCK'
      } else if (damageRate > 25) {
        recommendation = 'REPLACE_OR_REPAIR'
      }

      return {
        itemId: item.id,
        itemName: item.name,
        category: item.category.name,
        categoryType: item.category.type,
        location: item.location.name,
        currentStock: item.stock,
        minStock: item.minStock,
        
        // Utilization metrics
        totalBorrowings: totalTransactions,
        totalBorrowDays,
        averageBorrowDuration: Math.round(averageBorrowDuration * 100) / 100,
        utilizationRate: Math.round(utilizationRate * 100) / 100,
        
        // Condition metrics
        conditionStatus,
        totalDamaged,
        totalLost,
        totalReturned,
        damageRate: Math.round(damageRate * 100) / 100,
        lossRate: Math.round(lossRate * 100) / 100,
        
        // Maintenance and costs
        maintenanceNeeded,
        estimatedItemValue,
        totalLossValue,
        totalDamageValue,
        totalCostImpact: totalLossValue + totalDamageValue,
        
        // Recommendations
        recommendation,
        
        // Last activity
        lastBorrowed: item.transactionItems.length > 0 || item.borrowingItems.length > 0 
          ? new Date(Math.max(
              ...item.transactionItems.map(ti => new Date(ti.transaction.transactionDate).getTime()),
              ...item.borrowingItems.map(bi => new Date(bi.borrowing.borrowDate).getTime())
            )).toISOString()
          : null,
        
        // Status flags
        isLowStock: item.stock <= item.minStock,
        isHighUtilization: utilizationRate > 70,
        isHighDamage: damageRate > 20,
        isHighLoss: lossRate > 10
      }
    })

    // Sort by total cost impact (highest first)
    comprehensiveData.sort((a, b) => b.totalCostImpact - a.totalCostImpact)

    // Calculate summary statistics
    const summary = {
      totalItems: comprehensiveData.length,
      itemsNeedingMaintenance: comprehensiveData.filter(item => item.maintenanceNeeded).length,
      highUtilizationItems: comprehensiveData.filter(item => item.isHighUtilization).length,
      highDamageItems: comprehensiveData.filter(item => item.isHighDamage).length,
      lowStockItems: comprehensiveData.filter(item => item.isLowStock).length,
      totalCostImpact: comprehensiveData.reduce((sum, item) => sum + item.totalCostImpact, 0),
      averageUtilizationRate: comprehensiveData.reduce((sum, item) => sum + item.utilizationRate, 0) / comprehensiveData.length,
      averageDamageRate: comprehensiveData.reduce((sum, item) => sum + item.damageRate, 0) / comprehensiveData.length,
      
      // Recommendations summary
      recommendationCounts: {
        MAINTAIN: comprehensiveData.filter(item => item.recommendation === 'MAINTAIN').length,
        INCREASE_STOCK: comprehensiveData.filter(item => item.recommendation === 'INCREASE_STOCK').length,
        REPLACE_OR_REPAIR: comprehensiveData.filter(item => item.recommendation === 'REPLACE_OR_REPAIR').length,
        CONSIDER_DISPOSAL: comprehensiveData.filter(item => item.recommendation === 'CONSIDER_DISPOSAL').length
      }
    }

    return NextResponse.json({
      success: true,
      data: comprehensiveData,
      summary,
      generatedAt: new Date().toISOString(),
      filters: {
        dateFrom,
        dateTo
      }
    })

  } catch (error) {
    console.error('Error generating comprehensive report:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate comprehensive report' },
      { status: 500 }
    )
  }
}
