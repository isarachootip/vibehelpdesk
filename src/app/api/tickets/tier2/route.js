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

    // Tier 2 sees ONLY tickets that have been escalated from Tier 1 (is_escalated = true)
    // and are assigned to them, or all escalated if Admin
    let whereCondition;

    if (role === 'ADMIN') {
      whereCondition = {
        is_escalated: true,
      };
    } else {
      // Tier 2 sees tickets escalated to them specifically
      whereCondition = {
        AND: [
          { is_escalated: true },
          {
            OR: [
              { tier2_id: userId },
              { owner_id: userId },
              // Also see newly escalated tickets not yet assigned
              { AND: [{ tier2_id: null }, { status: 'ESCALATED' }] }
            ]
          }
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
        tier1: { select: { user_id: true, full_name: true } },
        tier2: { select: { user_id: true, full_name: true, specialization: true } },
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
