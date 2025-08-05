import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ItemCondition } from '@/types'

// GET /api/reports/damages - Generate damage and loss report
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const category = searchParams.get('category')
    const damageLevel = searchParams.get('damageLevel')

    // Build where clause for filtering
    const whereClause: Record<string, unknown> = {
      OR: [
        { condition: ItemCondition.DAMAGED },
        { condition: ItemCondition.LOST },
        { condition: ItemCondition.INCOMPLETE },
        { damagedQuantity: { gt: 0 } },
        { lostQuantity: { gt: 0 } }
      ]
    }

    if (dateFrom || dateTo) {
      whereClause.borrowing = {
        returnDate: {}
      }
      if (dateFrom) (whereClause.borrowing as any).returnDate.gte = new Date(dateFrom)
      if (dateTo) (whereClause.borrowing as any).returnDate.lte = new Date(dateTo)
    }

    if (category) {
      whereClause.item = {
        category: {
          name: category
        }
      }
    }

    // Get damaged/lost borrowing items
    const damagedItems = await prisma.borrowingItem.findMany({
      where: whereClause,
      include: {
        item: {
          include: {
            category: true
          }
        },
        borrowing: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // Process damage data
    const damageData = damagedItems
      .filter(item => item.condition && item.condition !== ItemCondition.GOOD)
      .map(item => {
        // Calculate estimated cost based on condition and quantities
        const baseItemCost = 100000 // Default base cost per item
        let estimatedCost = 0
        let severity: 'minor' | 'major' | 'total' = 'minor'

        if (item.condition === ItemCondition.DAMAGED) {
          // Damaged items cost 30-70% of original value to repair/replace
          const damageRatio = (item.damagedQuantity || 0) / item.quantity
          if (damageRatio > 0.7) {
            severity = 'major'
            estimatedCost = baseItemCost * (item.damagedQuantity || 0) * 0.7
          } else if (damageRatio > 0.3) {
            severity = 'major'
            estimatedCost = baseItemCost * (item.damagedQuantity || 0) * 0.5
          } else {
            severity = 'minor'
            estimatedCost = baseItemCost * (item.damagedQuantity || 0) * 0.3
          }
        } else if (item.condition === ItemCondition.LOST) {
          // Lost items cost 100% of original value
          severity = 'total'
          estimatedCost = baseItemCost * (item.lostQuantity || 0)
        } else if (item.condition === ItemCondition.INCOMPLETE) {
          // Incomplete items cost 20-50% of original value
          severity = 'minor'
          estimatedCost = baseItemCost * (item.quantity - item.returnedQuantity) * 0.4
        }

        // Apply damage level filter
        if (damageLevel) {
          if (damageLevel === 'minor' && severity !== 'minor') return null
          if (damageLevel === 'major' && severity !== 'major') return null
          if (damageLevel === 'total' && severity !== 'total') return null
          if (damageLevel === 'lost' && item.condition !== ItemCondition.LOST) return null
        }

        return {
          borrowingId: item.borrowingId,
          borrowerName: item.borrowing.borrowerName,
          itemName: item.item.name,
          category: item.item.category.name,
          damageDate: item.borrowing.returnDate?.toISOString().split('T')[0] ||
                     item.updatedAt.toISOString().split('T')[0],
          condition: item.condition,
          damagedQuantity: item.damagedQuantity || 0,
          lostQuantity: item.lostQuantity || 0,
          returnNotes: item.returnNotes || '',
          estimatedCost,
          severity
        }
      })
      .filter(item => item !== null) // Remove filtered out items

    // Calculate summary statistics
    const totalCost = damageData.reduce((sum, item) => sum + item.estimatedCost, 0)
    const damagesByCategory = damageData.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = { count: 0, cost: 0 }
      }
      acc[item.category].count += 1
      acc[item.category].cost += item.estimatedCost
      return acc
    }, {} as Record<string, { count: number; cost: number }>)

    const damagesBySeverity = damageData.reduce((acc, item) => {
      if (!acc[item.severity]) {
        acc[item.severity] = { count: 0, cost: 0 }
      }
      acc[item.severity].count += 1
      acc[item.severity].cost += item.estimatedCost
      return acc
    }, {} as Record<string, { count: number; cost: number }>)

    return NextResponse.json({
      success: true,
      data: damageData,
      summary: {
        totalDamages: damageData.length,
        totalCost,
        averageCostPerIncident: damageData.length > 0 ? totalCost / damageData.length : 0,
        damagesByCategory: Object.entries(damagesByCategory).map(([category, stats]) => ({
          category,
          count: stats.count,
          cost: stats.cost
        })),
        damagesBySeverity: Object.entries(damagesBySeverity).map(([severity, stats]) => ({
          severity,
          count: stats.count,
          cost: stats.cost
        })),
        topDamagedItems: damageData
          .reduce((acc, item) => {
            const existing = acc.find(i => i.itemName === item.itemName)
            if (existing) {
              existing.count += 1
              existing.totalCost += item.estimatedCost
            } else {
              acc.push({
                itemName: item.itemName,
                count: 1,
                totalCost: item.estimatedCost
              })
            }
            return acc
          }, [] as Array<{ itemName: string; count: number; totalCost: number }>)
          .sort((a, b) => b.totalCost - a.totalCost)
          .slice(0, 10)
      }
    })

  } catch (error) {
    console.error('Error generating damage report:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate damage report' },
      { status: 500 }
    )
  }
}
