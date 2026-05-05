import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateTicketNo } from '@/lib/ticket-utils';

// GET: List all tickets with filters
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const bu_id = searchParams.get('bu_id');
    const system_id = searchParams.get('system_id');
    const search = searchParams.get('search');

    const where = {};
    if (status && status !== 'all') where.status = status;
    if (priority && priority !== 'all') where.priority = priority;
    if (bu_id) where.bu_id = parseInt(bu_id);
    if (system_id) where.system_id = parseInt(system_id);
    if (search) {
      where.OR = [
        { ticket_no: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { symptom: { contains: search, mode: 'insensitive' } },
      ];
    }

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        system: true,
        location: true,
        reporter: { select: { user_id: true, full_name: true, email: true } },
        tier1: { select: { user_id: true, full_name: true } },
        tier2: { select: { user_id: true, full_name: true } },
        owner: { select: { user_id: true, full_name: true } },
        bu: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error('GET /api/tickets error:', error);
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
  }
}

// POST: Create a new ticket
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      subject, problem_type, system_id, location_id,
      reporter_id, reporter_email, bu_id, priority,
      description, symptom
    } = body;

    // Validate required fields
    if (!subject || !problem_type || !system_id || !location_id || !reporter_id || !bu_id || !priority || !description || !symptom) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get BU code for ticket number
    const bu = await prisma.businessUnit.findUnique({ where: { bu_id: parseInt(bu_id) } });
    if (!bu) {
      return NextResponse.json({ error: 'Invalid BU' }, { status: 400 });
    }

    // Generate ticket number: BU + DDMMYYYY + 5-digit running
    const ticket_no = await generateTicketNo(bu.bu_code, bu.bu_id);

    // Get system owner for auto-assign
    const system = await prisma.systemGroup.findUnique({ where: { system_id: parseInt(system_id) } });

    const ticket = await prisma.ticket.create({
      data: {
        ticket_no,
        subject,
        problem_type,
        system_id: parseInt(system_id),
        location_id: parseInt(location_id),
        reporter_id: parseInt(reporter_id),
        reporter_email: reporter_email || '',
        bu_id: parseInt(bu_id),
        owner_id: system?.owner_user_id || null,
        priority,
        description,
        symptom,
        status: 'NEW',
      },
      include: {
        system: true,
        location: true,
        reporter: true,
        bu: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        ticket_id: ticket.ticket_id,
        user_id: parseInt(reporter_id),
        action: 'CREATE',
        detail: `Ticket ${ticket_no} created`,
        new_value: JSON.stringify({ status: 'NEW', priority }),
      },
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error('POST /api/tickets error:', error);
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
  }
}
