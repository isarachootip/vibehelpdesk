export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const tickets = await prisma.ticket.findMany({
      where: {
        OR: [
          { is_escalated: true },
          { status: { in: ['ESCALATED', 'IN_PROGRESS_TIER2', 'RESOLVED_TIER2'] } }
        ]
      },
      include: {
        system: true,
        location: true,
        reporter: true,
        bu: true,
      },
      orderBy: { created_at: 'desc' }
    });
    return NextResponse.json(tickets);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
