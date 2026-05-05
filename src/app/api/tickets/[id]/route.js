import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Fetch single ticket with full details
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const ticket = await prisma.ticket.findUnique({
      where: { ticket_id: parseInt(id) },
      include: {
        system: true,
        location: true,
        reporter: { select: { user_id: true, full_name: true, email: true, phone: true } },
        tier1: { select: { user_id: true, full_name: true, email: true } },
        tier2: { select: { user_id: true, full_name: true, email: true } },
        owner: { select: { user_id: true, full_name: true, email: true } },
        bu: true,
        attachments: true,
        audit_logs: { orderBy: { created_at: 'desc' } },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error('GET /api/tickets/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch ticket' }, { status: 500 });
  }
}

// PUT: Update ticket (status changes, assignments, assessments, etc.)
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const ticketId = parseInt(id);
    const body = await request.json();
    const { action, user_id, ...data } = body;

    const existing = await prisma.ticket.findUnique({ where: { ticket_id: ticketId } });
    if (!existing) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    let updateData = {};
    let auditAction = action || 'UPDATE';
    let auditDetail = '';

    switch (action) {
      case 'TIER1_ACCEPT':
        updateData = {
          status: 'IN_PROGRESS',
          tier1_id: parseInt(user_id),
          tier1_accepted_at: new Date(),
        };
        auditDetail = 'Tier 1 accepted ticket';
        break;

      case 'TIER1_ASSESS':
        updateData = {
          tier1_assessed_at: new Date(),
          initial_assessment: data.initial_assessment,
          preliminary_cause: data.preliminary_cause,
          tier1_action: data.tier1_action,
        };
        auditDetail = 'Tier 1 completed initial assessment';
        break;

      case 'ESCALATE':
        updateData = {
          status: 'ESCALATED',
          is_escalated: true,
          escalated_at: new Date(),
          escalate_reason: data.escalate_reason,
          tier2_id: data.tier2_id ? parseInt(data.tier2_id) : null,
        };
        auditDetail = `Escalated to Tier 2: ${data.escalate_reason}`;
        break;

      case 'TIER2_ACCEPT':
        updateData = {
          status: 'IN_PROGRESS',
          tier2_id: parseInt(user_id),
          tier2_accepted_at: new Date(),
        };
        auditDetail = 'Tier 2 accepted ticket';
        break;

      case 'START_REPAIR':
        updateData = {
          repair_started_at: new Date(),
        };
        auditDetail = 'Tier 2 started repair';
        break;

      case 'RESOLVE':
        updateData = {
          status: 'RESOLVED',
          resolved_at: new Date(),
          root_cause: data.root_cause,
          root_cause_category: data.root_cause_category,
          resolution: data.resolution,
          resolution_detail: data.resolution_detail,
          preventive_action: data.preventive_action,
        };
        auditDetail = 'Ticket resolved';
        break;

      case 'CONFIRM':
        updateData = {
          status: 'CLOSED',
          user_confirmed_at: new Date(),
          closed_at: new Date(),
          user_satisfaction: data.user_satisfaction ? parseInt(data.user_satisfaction) : null,
          user_comment: data.user_comment,
        };
        auditDetail = `User confirmed resolution (satisfaction: ${data.user_satisfaction}/5)`;
        break;

      case 'REOPEN':
        updateData = {
          status: 'REOPENED',
          reopened_at: new Date(),
        };
        auditDetail = 'Ticket reopened';
        break;

      case 'CANCEL':
        updateData = {
          status: 'CANCELLED',
          closed_at: new Date(),
        };
        auditDetail = 'Ticket cancelled';
        break;

      default:
        updateData = data;
        auditDetail = 'Ticket updated';
    }

    const ticket = await prisma.ticket.update({
      where: { ticket_id: ticketId },
      data: updateData,
      include: {
        system: true,
        location: true,
        reporter: { select: { user_id: true, full_name: true, email: true } },
        tier1: { select: { user_id: true, full_name: true } },
        tier2: { select: { user_id: true, full_name: true } },
        bu: true,
      },
    });

    // Create audit log
    if (user_id) {
      await prisma.auditLog.create({
        data: {
          ticket_id: ticketId,
          user_id: parseInt(user_id),
          action: auditAction,
          detail: auditDetail,
          old_value: existing.status,
          new_value: ticket.status,
        },
      });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error('PUT /api/tickets/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 });
  }
}
