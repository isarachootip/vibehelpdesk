export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import * as jose from 'jose';

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super-secret-key-12345'
);

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('hd_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let payload;
    try {
      const verified = await jose.jwtVerify(token, JWT_SECRET);
      payload = verified.payload;
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = payload.userId;
    const role = payload.role?.toUpperCase();

    // Default filter for Tier 2: tickets assigned to them or owned by them
    let whereCondition = {
      OR: [
        { tier2_id: userId },
        { owner_id: userId }
      ]
    };

    // If Admin, they see all escalated or Tier 2 relevant tickets
    if (role === 'ADMIN') {
      whereCondition = {
        OR: [
          { is_escalated: true },
          { status: { in: ['ESCALATED', 'IN_PROGRESS_TIER2', 'RESOLVED_TIER2'] } }
        ]
      };
    }

    const tickets = await prisma.ticket.findMany({
      where: whereCondition,
      include: {
        system: true,
        location: true,
        reporter: true,
        bu: true,
        tier2: { select: { user_id: true, full_name: true } },
        tier3: { select: { user_id: true, full_name: true } },
      },
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error('GET /api/tickets/tier2 error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
