import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TransactionType, ActivityType } from '@prisma/client';
import { ReportData } from '@/interfaces/Report';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const reportType = searchParams.get('type');
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');

  try {
    let data: ReportData[] = [];
    const whereClause: any = {};
    if (dateFrom) {
      whereClause.createdAt = { ...whereClause.createdAt, gte: new Date(dateFrom) };
    }
    if (dateTo) {
      whereClause.createdAt = { ...whereClause.createdAt, lte: new Date(dateTo) };
    }

    switch (reportType) {
      case 'all-activities':
        whereClause.type = {
          in: [ActivityType.ITEM_BORROWED, ActivityType.MATERIAL_REQUESTED]
        };
        const activities = await prisma.activity.findMany({
          where: whereClause,
          include: { item: { include: { category: true } } },
          orderBy: { createdAt: 'desc' },
        });
        data = activities.map((activity) => ({
          ...activity,
          _id: activity.id,
          name: activity.item?.name || 'N/A',
          description: `Activity: ${activity.type}`,
        }));
        break;

      case 'tools':
        whereClause.type = TransactionType.BORROWING;
        const toolTransactions = await prisma.transaction.findMany({
          where: whereClause,
          include: { items: { include: { item: { include: { category: true } } } } },
          orderBy: { createdAt: 'desc' },
        });
        data = toolTransactions.flatMap((transaction) =>
          transaction.items.map((transactionItem) => ({
            ...transaction,
            ...transactionItem,
            _id: transaction.id,
            name: transactionItem.item.name,
            description: `Transaction: ${transaction.type}`,
          }))
        );
        break;

      case 'materials':
        whereClause.type = TransactionType.REQUEST;
        const materialTransactions = await prisma.transaction.findMany({
          where: whereClause,
          include: { items: { include: { item: { include: { category: true } } } } },
          orderBy: { createdAt: 'desc' },
        });
        data = materialTransactions.flatMap((transaction) =>
          transaction.items.map((transactionItem) => ({
            ...transaction,
            ...transactionItem,
            _id: transaction.id,
            name: transactionItem.item.name,
            description: `Transaction: ${transaction.type}`,
          }))
        );
        break;

      case 'conditions-damage-utilization':
        // This is a complex report and will be handled separately.
        // For now, we return a placeholder.
        data = [];
        break;

      default:
        return NextResponse.json({ success: false, error: 'Invalid report type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error(`Error fetching report data for type: ${reportType}`, error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch report data' },
      { status: 500 }
    );
  }
}
