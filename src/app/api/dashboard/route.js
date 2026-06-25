import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Dashboard statistics
export async function GET(request) {
  try {
    // Today boundaries (local midnight)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      totalTickets,
      newTickets,
      inProgressTickets,
      escalatedTickets,
      resolvedTickets,
      closedTickets,
      criticalTickets,
      newToday,
      resolvedToday,
      closedToday,
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
      prisma.ticket.count({ where: { created_at: { gte: todayStart, lte: todayEnd } } }),
      prisma.ticket.count({ where: { status: 'RESOLVED', resolved_at: { gte: todayStart, lte: todayEnd } } }),
      prisma.ticket.count({ where: { status: 'CLOSED', closed_at: { gte: todayStart, lte: todayEnd } } }),
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

    // Calculate Aging Report
    const activeTickets = await prisma.ticket.findMany({
      where: {
        status: {
          notIn: ['RESOLVED', 'CLOSED', 'CANCELLED']
        }
      },
      include: {
        tier1: { select: { full_name: true } },
        tier2: { select: { full_name: true } },
        tier3: { select: { full_name: true } },
        system: { select: { system_name: true } },
      }
    });

    const agingReport = {
      tier1: { '< 24h': 0, '1-3d': 0, '3-7d': 0, '> 7d': 0, tickets: [] },
      tier2: { '< 24h': 0, '1-3d': 0, '3-7d': 0, '> 7d': 0, tickets: [] },
      tier3: { '< 24h': 0, '1-3d': 0, '3-7d': 0, '> 7d': 0, tickets: [] }
    };

    const now = new Date();

    for (const ticket of activeTickets) {
      let tier = 'tier1';
      let startTime = ticket.created_at;

      if (ticket.status === 'ESCALATED_TIER3' || ticket.tier3_id !== null) {
        tier = 'tier3';
        startTime = ticket.tier3_assigned_at || ticket.tier3_accepted_at || ticket.escalated_at || ticket.created_at;
      } else if (ticket.status === 'ESCALATED' || ticket.tier2_id !== null || ticket.is_escalated) {
        tier = 'tier2';
        startTime = ticket.escalated_at || ticket.tier2_accepted_at || ticket.created_at;
      }

      const diffMs = now - new Date(startTime);
      const diffHours = diffMs / (1000 * 60 * 60);
      const diffDays = diffHours / 24;

      let bracket = '> 7d';
      if (diffHours < 24) {
        bracket = '< 24h';
      } else if (diffDays <= 3) {
        bracket = '1-3d';
      } else if (diffDays <= 7) {
        bracket = '3-7d';
      }

      agingReport[tier][bracket]++;
      agingReport[tier].tickets.push({
        ticket_id: ticket.ticket_id,
        ticket_no: ticket.ticket_no,
        subject: ticket.subject,
        system_name: ticket.system?.system_name,
        status: ticket.status,
        startTime: startTime,
        ageHours: Math.round(diffHours * 10) / 10,
        ageDays: Math.round(diffDays * 10) / 10,
        assigneeName: (tier === 'tier3' ? ticket.tier3?.full_name : (tier === 'tier2' ? ticket.tier2?.full_name : ticket.tier1?.full_name)) || 'ยังไม่ได้มอบหมาย'
      });
    }

    agingReport.tier1.tickets.sort((a, b) => b.ageHours - a.ageHours);
    agingReport.tier2.tickets.sort((a, b) => b.ageHours - a.ageHours);
    agingReport.tier3.tickets.sort((a, b) => b.ageHours - a.ageHours);

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
        newToday,
        resolvedToday,
        closedToday,
      },
      recentTickets,
      ticketsByBU: enrichedByBU,
      ticketsBySystem: enrichedBySystem,
      ticketsByPriority,
      ticketsByStatus,
      agingReport,
    });
  } catch (error) {
    console.error('GET /api/dashboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
