import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TransactionType, ActivityType } from '@prisma/client';
import { ReportData } from '@/interfaces/Report';

interface ActivityWhereClause {
  createdAt?: {
    gte?: Date;
    lte?: Date;
  };
  type?: {
    in?: ActivityType[];
  };
}

interface TransactionWhereClause {
  createdAt?: {
    gte?: Date;
    lte?: Date;
  };
  type?: TransactionType;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const reportType = searchParams.get('type');
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');

  try {
    let data: ReportData[] = [];

    switch (reportType) {
      case 'all-activities':
        const activityWhereClause: ActivityWhereClause = {};
        if (dateFrom) {
          activityWhereClause.createdAt = { ...activityWhereClause.createdAt, gte: new Date(dateFrom) };
        }
        if (dateTo) {
          activityWhereClause.createdAt = { ...activityWhereClause.createdAt, lte: new Date(dateTo) };
        }
        activityWhereClause.type = {
          in: [ActivityType.ITEM_BORROWED, ActivityType.MATERIAL_REQUESTED]
        };
        
        const activities = await prisma.activity.findMany({
          where: activityWhereClause,
          include: { item: { include: { category: true } } },
          orderBy: { createdAt: 'desc' },
        });
        data = activities.map((activity) => ({
          _id: activity.id,
          name: activity.item?.name || 'N/A',
          description: `Activity: ${activity.type}`,
          id: activity.id,
          type: activity.type,
          metadata: activity.metadata,
          createdAt: activity.createdAt,
          transactionId: activity.transactionId,
          itemId: activity.itemId,
          borrowingId: activity.borrowingId,
          userId: activity.userId,
        }));
        break;

      case 'tools':
        const toolWhereClause: TransactionWhereClause = {};
        if (dateFrom) {
          toolWhereClause.createdAt = { ...toolWhereClause.createdAt, gte: new Date(dateFrom) };
        }
        if (dateTo) {
          toolWhereClause.createdAt = { ...toolWhereClause.createdAt, lte: new Date(dateTo) };
        }
        toolWhereClause.type = TransactionType.BORROWING;
        
        const toolTransactions = await prisma.transaction.findMany({
          where: toolWhereClause,
          include: { items: { include: { item: { include: { category: true } } } } },
          orderBy: { createdAt: 'desc' },
        });
        data = toolTransactions.flatMap((transaction) =>
          transaction.items.map((transactionItem) => ({
            _id: transaction.id,
            name: transactionItem.item.name,
            description: `Transaction: ${transaction.type}`,
            id: transaction.id,
            type: transaction.type,
            requesterName: transaction.requesterName,
            purpose: transaction.purpose,
            transactionDate: transaction.transactionDate,
            returnDate: transaction.returnDate,
            expectedReturnDate: transaction.expectedReturnDate,
            status: transaction.status,
            notes: transaction.notes,
            createdAt: transaction.createdAt,
            updatedAt: transaction.updatedAt,
            consumedDate: transaction.consumedDate,
            transactionItemId: transactionItem.id,
            itemId: transactionItem.itemId,
            quantity: transactionItem.quantity,
            returnedQuantity: transactionItem.returnedQuantity,
            consumedQuantity: transactionItem.consumedQuantity,
            damagedQuantity: transactionItem.damagedQuantity,
            lostQuantity: transactionItem.lostQuantity,
            itemStatus: transactionItem.status,
            condition: transactionItem.condition,
            returnNotes: transactionItem.returnNotes,
            itemNotes: transactionItem.notes,
            itemCreatedAt: transactionItem.createdAt,
            itemUpdatedAt: transactionItem.updatedAt,
          }))
        );
        break;

      case 'materials':
        const materialWhereClause: TransactionWhereClause = {};
        if (dateFrom) {
          materialWhereClause.createdAt = { ...materialWhereClause.createdAt, gte: new Date(dateFrom) };
        }
        if (dateTo) {
          materialWhereClause.createdAt = { ...materialWhereClause.createdAt, lte: new Date(dateTo) };
        }
        materialWhereClause.type = TransactionType.REQUEST;
        
        const materialTransactions = await prisma.transaction.findMany({
          where: materialWhereClause,
          include: { items: { include: { item: { include: { category: true } } } } },
          orderBy: { createdAt: 'desc' },
        });
        data = materialTransactions.flatMap((transaction) =>
          transaction.items.map((transactionItem) => ({
            _id: transaction.id,
            name: transactionItem.item.name,
            description: `Transaction: ${transaction.type}`,
            id: transaction.id,
            type: transaction.type,
            requesterName: transaction.requesterName,
            purpose: transaction.purpose,
            transactionDate: transaction.transactionDate,
            returnDate: transaction.returnDate,
            expectedReturnDate: transaction.expectedReturnDate,
            status: transaction.status,
            notes: transaction.notes,
            createdAt: transaction.createdAt,
            updatedAt: transaction.updatedAt,
            consumedDate: transaction.consumedDate,
            transactionItemId: transactionItem.id,
            itemId: transactionItem.itemId,
            quantity: transactionItem.quantity,
            returnedQuantity: transactionItem.returnedQuantity,
            consumedQuantity: transactionItem.consumedQuantity,
            damagedQuantity: transactionItem.damagedQuantity,
            lostQuantity: transactionItem.lostQuantity,
            itemStatus: transactionItem.status,
            condition: transactionItem.condition,
            returnNotes: transactionItem.returnNotes,
            itemNotes: transactionItem.notes,
            itemCreatedAt: transactionItem.createdAt,
            itemUpdatedAt: transactionItem.updatedAt,
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
