import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import * as jose from 'jose';

export const dynamic = 'force-dynamic';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super-secret-key-12345'
);

// GET: Dashboard statistics for General User (filtered by their own BU)
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('hd_token')?.value;

    let userId = null;
    let userBuId = null;

    if (token) {
      try {
        const { payload } = await jose.jwtVerify(token, JWT_SECRET);
        userId = payload.userId;
        userBuId = payload.buId || null;
      } catch (e) {}
    }

    const where = {};
    if (userBuId) where.bu_id = userBuId;

    const today = new Date();
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const [total, open, resolved, closed] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.count({ where: { ...where, status: { notIn: ['CLOSED', 'CANCELLED', 'RESOLVED'] } } }),
      prisma.ticket.count({ where: { ...where, status: 'RESOLVED' } }),
      prisma.ticket.count({ where: { ...where, status: 'CLOSED' } }),
    ]);

    // My own tickets (reporter)
    const myTickets = userId
      ? await prisma.ticket.findMany({
          where: { reporter_id: userId },
          include: {
            system: { select: { system_code: true, system_name: true } },
            bu: { select: { bu_code: true, bu_name: true } },
          },
          orderBy: { created_at: 'desc' },
          take: 20,
        })
      : [];

    // BU recent tickets
    const buTickets = await prisma.ticket.findMany({
      where,
      include: {
        system: { select: { system_code: true, system_name: true } },
        bu: { select: { bu_code: true, bu_name: true } },
        tier1: { select: { full_name: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      stats: { total, open, resolved, closed },
      myTickets,
      buTickets,
    });
  } catch (error) {
    console.error('GET /api/dashboard/user error:', error);
    return NextResponse.json({ error: 'Failed to fetch user dashboard data' }, { status: 500 });
  }
}
