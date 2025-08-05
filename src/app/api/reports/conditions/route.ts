import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ItemCondition } from '@/types'

// GET /api/reports/conditions - Generate condition report
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const category = searchParams.get('category')
    const condition = searchParams.get('condition')

    // Build where clause for filtering
    const whereClause: Record<string, any> = {}

    if (dateFrom || dateTo) {
      whereClause.borrowing = {
        borrowDate: {}
      }
      if (dateFrom) (whereClause.borrowing as any).borrowDate.gte = new Date(dateFrom)
      if (dateTo) (whereClause.borrowing as any).borrowDate.lte = new Date(dateTo)
    }

    if (category) {
      whereClause.item = {
        category: {
          name: category
        }
      }
    }

    if (condition) {
      whereClause.condition = condition as ItemCondition
    }

    // Get borrowing items with condition data
    const borrowingItems = await prisma.borrowingItem.findMany({
      where: whereClause,
      include: {
        item: {
          include: {
            category: true
          }
        },
        borrowing: true
      }
    })

    // Group by item and calculate condition statistics
    const itemStats = new Map()

    borrowingItems.forEach(borrowingItem => {
      const itemId = borrowingItem.itemId
      const itemName = borrowingItem.item.name
      const categoryName = borrowingItem.item.category.name

      if (!itemStats.has(itemId)) {
        itemStats.set(itemId, {
          itemId,
          itemName,
          category: categoryName,
          totalBorrowings: 0,
          goodReturns: 0,
          damagedReturns: 0,
          lostItems: 0,
          totalQuantity: 0,
          returnedQuantity: 0,
          damagedQuantity: 0,
          lostQuantity: 0,
          lastCondition: null,
          estimatedValue: 50000, // Default estimated value per item
          conditions: []
        })
      }

      const stats = itemStats.get(itemId)
      stats.totalBorrowings += 1
      stats.totalQuantity += borrowingItem.quantity
      stats.returnedQuantity += borrowingItem.returnedQuantity
      stats.damagedQuantity += borrowingItem.damagedQuantity || 0
      stats.lostQuantity += borrowingItem.lostQuantity || 0

      // Count returns by condition
      if (borrowingItem.returnedQuantity > 0) {
        if (borrowingItem.condition === ItemCondition.GOOD || !borrowingItem.condition) {
          stats.goodReturns += 1
        } else if (borrowingItem.condition === ItemCondition.DAMAGED) {
          stats.damagedReturns += 1
        } else if (borrowingItem.condition === ItemCondition.LOST) {
          stats.lostItems += 1
        }
      }

      if (borrowingItem.condition) {
        stats.lastCondition = borrowingItem.condition
        stats.conditions.push(borrowingItem.condition)
      }
    })

    // Calculate rates and prepare final data
    const conditionData = Array.from(itemStats.values()).map(stats => {
      const totalReturns = stats.goodReturns + stats.damagedReturns + stats.lostItems
      const damageRate = totalReturns > 0 ? stats.damagedReturns / totalReturns : 0
      const lossRate = totalReturns > 0 ? stats.lostItems / totalReturns : 0

      // Calculate total loss (damaged + lost items * estimated value)
      const totalLoss = (stats.damagedQuantity + stats.lostQuantity) * stats.estimatedValue

      // Determine if maintenance is needed based on damage rate
      const maintenanceNeeded = damageRate > 0.2 || lossRate > 0.1

      return {
        itemId: stats.itemId,
        itemName: stats.itemName,
        category: stats.category,
        totalBorrowings: stats.totalBorrowings,
        goodReturns: stats.goodReturns,
        damagedReturns: stats.damagedReturns,
        lostItems: stats.lostItems,
        damageRate,
        lossRate,
        lastCondition: stats.lastCondition,
        maintenanceNeeded,
        estimatedValue: stats.estimatedValue * stats.totalQuantity,
        totalLoss
      }
    })

    // Sort by damage rate (highest first)
    conditionData.sort((a, b) => (b.damageRate + b.lossRate) - (a.damageRate + a.lossRate))

    return NextResponse.json({
      success: true,
      data: conditionData,
      summary: {
        totalItems: conditionData.length,
        itemsNeedingMaintenance: conditionData.filter(item => item.maintenanceNeeded).length,
        averageDamageRate: conditionData.reduce((sum, item) => sum + item.damageRate, 0) / conditionData.length,
        averageLossRate: conditionData.reduce((sum, item) => sum + item.lossRate, 0) / conditionData.length,
        totalEstimatedLoss: conditionData.reduce((sum, item) => sum + item.totalLoss, 0)
      }
    })

  } catch (error) {
    console.error('Error generating condition report:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate condition report' },
      { status: 500 }
    )
  }
}
