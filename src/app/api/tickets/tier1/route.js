export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Tier 1 sees ALL tickets (every status) to monitor the full lifecycle
    const tickets = await prisma.ticket.findMany({
      include: {
        system: true,
        location: true,
        reporter: true,
        bu: true,
        tier1: true,
        tier2: { select: { user_id: true, full_name: true, specialization: true } },
      },
      orderBy: { created_at: 'desc' }
    });
    return NextResponse.json(tickets);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
