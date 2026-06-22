import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/dashboard/trend?period=mtd|weekly|yearly
 * Returns daily ticket counts for line chart visualization
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'mtd';

    const now = new Date();
    let startDate;

    if (period === 'weekly') {
      // Last 7 days
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'yearly') {
      // Jan 1 of current year
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    } else {
      // MTD: 1st of current month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    }

    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    // Fetch all tickets in range
    const tickets = await prisma.ticket.findMany({
      where: {
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        ticket_id: true,
        created_at: true,
        status: true,
      },
      orderBy: { created_at: 'asc' },
    });

    // Build date buckets
    const buckets = {};
    const cursor = new Date(startDate);

    if (period === 'yearly') {
      // Monthly buckets for yearly view
      while (cursor <= endDate) {
        const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
        buckets[key] = { total: 0, resolved: 0, open: 0 };
        cursor.setMonth(cursor.getMonth() + 1);
      }

      tickets.forEach((t) => {
        const d = new Date(t.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (buckets[key]) {
          buckets[key].total++;
          if (['RESOLVED', 'CLOSED'].includes(t.status)) {
            buckets[key].resolved++;
          } else if (!['CANCELLED'].includes(t.status)) {
            buckets[key].open++;
          }
        }
      });
    } else {
      // Daily buckets for MTD / Weekly
      while (cursor <= endDate) {
        const key = cursor.toISOString().slice(0, 10);
        buckets[key] = { total: 0, resolved: 0, open: 0 };
        cursor.setDate(cursor.getDate() + 1);
      }

      tickets.forEach((t) => {
        const key = new Date(t.created_at).toISOString().slice(0, 10);
        if (buckets[key]) {
          buckets[key].total++;
          if (['RESOLVED', 'CLOSED'].includes(t.status)) {
            buckets[key].resolved++;
          } else if (!['CANCELLED'].includes(t.status)) {
            buckets[key].open++;
          }
        }
      });
    }

    const labels = Object.keys(buckets);
    const totalData = labels.map((k) => buckets[k].total);
    const resolvedData = labels.map((k) => buckets[k].resolved);
    const openData = labels.map((k) => buckets[k].open);

    // Summary stats
    const totalCount = totalData.reduce((a, b) => a + b, 0);
    const resolvedCount = resolvedData.reduce((a, b) => a + b, 0);
    const openCount = openData.reduce((a, b) => a + b, 0);

    return NextResponse.json({
      period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      labels,
      datasets: {
        total: totalData,
        resolved: resolvedData,
        open: openData,
      },
      summary: {
        total: totalCount,
        resolved: resolvedCount,
        open: openCount,
      },
    });
  } catch (error) {
    console.error('GET /api/dashboard/trend error:', error);
    return NextResponse.json({ error: 'Failed to fetch trend data' }, { status: 500 });
  }
}
