import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Dashboard statistics
export async function GET() {
  try {
    const [
      totalTickets,
      newTickets,
      inProgressTickets,
      escalatedTickets,
      resolvedTickets,
      closedTickets,
      criticalTickets,
      recentTickets,
      ticketsByBU,
      ticketsBySystem,
      ticketsByPriority,
      ticketsByStatus,
    ] = await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: 'NEW' } }),
      prisma.ticket.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.ticket.count({ where: { status: 'ESCALATED' } }),
      prisma.ticket.count({ where: { status: 'RESOLVED' } }),
      prisma.ticket.count({ where: { status: 'CLOSED' } }),
      prisma.ticket.count({ where: { priority: 'Critical', status: { notIn: ['CLOSED', 'CANCELLED'] } } }),
      prisma.ticket.findMany({
        take: 10,
        orderBy: { created_at: 'desc' },
        include: {
          system: { select: { system_code: true, system_name: true } },
          bu: { select: { bu_code: true, bu_name: true } },
          reporter: { select: { full_name: true, email: true } },
          tier1: { select: { full_name: true } },
          tier2: { select: { full_name: true } },
          location: { select: { location_name: true } },
        },
      }),
      prisma.ticket.groupBy({
        by: ['bu_id'],
        _count: { ticket_id: true },
        orderBy: { _count: { ticket_id: 'desc' } },
      }),
      prisma.ticket.groupBy({
        by: ['system_id'],
        _count: { ticket_id: true },
        orderBy: { _count: { ticket_id: 'desc' } },
        take: 5,
      }),
      prisma.ticket.groupBy({
        by: ['priority'],
        _count: { ticket_id: true },
      }),
      prisma.ticket.groupBy({
        by: ['status'],
        _count: { ticket_id: true },
      }),
    ]);

    // Enrich BU names
    const buIds = ticketsByBU.map(t => t.bu_id);
    const bus = await prisma.businessUnit.findMany({ where: { bu_id: { in: buIds } } });
    const buMap = Object.fromEntries(bus.map(b => [b.bu_id, b]));
    const enrichedByBU = ticketsByBU.map(t => ({
      ...t,
      bu_code: buMap[t.bu_id]?.bu_code,
      bu_name: buMap[t.bu_id]?.bu_name,
    }));

    // Enrich system names
    const sysIds = ticketsBySystem.map(t => t.system_id);
    const systems = await prisma.systemGroup.findMany({ where: { system_id: { in: sysIds } } });
    const sysMap = Object.fromEntries(systems.map(s => [s.system_id, s]));
    const enrichedBySystem = ticketsBySystem.map(t => ({
      ...t,
      system_code: sysMap[t.system_id]?.system_code,
      system_name: sysMap[t.system_id]?.system_name,
    }));

    return NextResponse.json({
      stats: {
        total: totalTickets,
        new: newTickets,
        in_progress: inProgressTickets,
        escalated: escalatedTickets,
        resolved: resolvedTickets,
        closed: closedTickets,
        critical: criticalTickets,
        open: totalTickets - closedTickets - (await prisma.ticket.count({ where: { status: 'CANCELLED' } })),
      },
      recentTickets,
      ticketsByBU: enrichedByBU,
      ticketsBySystem: enrichedBySystem,
      ticketsByPriority,
      ticketsByStatus,
    });
  } catch (error) {
    console.error('GET /api/dashboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
