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

    // Tier 3 sees tickets escalated to Tier 3 (ESCALATED_TIER3 status)
    // or assigned to them, or all ESCALATED_TIER3 if Admin
    let whereCondition;

    if (role === 'ADMIN') {
      whereCondition = {
        OR: [
          { status: 'ESCALATED_TIER3' },
          { tier3_id: { not: null } }
        ]
      };
    } else {
      whereCondition = {
        OR: [
          { AND: [{ status: 'ESCALATED_TIER3' }, { tier3_id: null }] }, // Unassigned escalated T3
          { tier3_id: userId }, // Assigned to this Tier 3
          { AND: [{ status: 'ESCALATED_TIER3' }, { tier3_id: userId }] }
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
        tier2: { select: { user_id: true, full_name: true } },
        tier3: { select: { user_id: true, full_name: true } },
      },
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error('GET /api/tickets/tier3 error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
