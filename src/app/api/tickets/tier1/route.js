export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const tickets = await prisma.ticket.findMany({
      where: {
        status: { in: ['NEW', 'IN_PROGRESS'] },
        is_escalated: false // If it's escalated, it moves to Tier 2
      },
      include: {
        system: true,
        location: true,
        reporter: true,
        bu: true,
        tier1: true
      },
      orderBy: { created_at: 'desc' }
    });
    return NextResponse.json(tickets);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
