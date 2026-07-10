import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateTicketNo, normalizeTicketNo } from '@/lib/ticket-utils';

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
      const normalizedSearch = normalizeTicketNo(search);
      where.OR = [
        { ticket_no: { contains: normalizedSearch, mode: 'insensitive' } },
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
        asset: { include: { asset_type: true } },
        reporter: { select: { user_id: true, full_name: true, email: true } },
        tier1: { select: { user_id: true, full_name: true } },
        tier2: { select: { user_id: true, full_name: true } },
        tier3: { select: { user_id: true, full_name: true } },
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
      subject, problem_type, system_id, hardware_id, asset_id, location_id, location_text,
      reporter_id, reporter_name, reporter_email, reporter_phone, reporter_line_id, 
      bu_id, priority, description, symptom
    } = body;

    // Validate required fields
    const hasSystemOrHardware = problem_type === 'hardware' ? (!!hardware_id || !!asset_id) : (!!system_id || problem_type === 'software');
    if (!subject || !problem_type || (!location_id && !location_text) || (!reporter_id && !reporter_name) || !bu_id || !description || !symptom) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get BU code for ticket number
    const bu = await prisma.businessUnit.findUnique({ where: { bu_id: parseInt(bu_id) } });
    if (!bu) {
      return NextResponse.json({ error: 'Invalid BU' }, { status: 400 });
    }

    // Generate ticket number: BU + DDMMYYYY + 5-digit running
    const ticket_no = await generateTicketNo(bu.bu_code, bu.bu_id);

    // Get system owner for auto-assign (only for software tickets)
    let system = null;
    if (system_id) {
      system = await prisma.systemGroup.findUnique({ where: { system_id: parseInt(system_id) } });
    }

    let final_reporter_id = reporter_id ? parseInt(reporter_id) : null;
    if (!final_reporter_id && reporter_name) {
      // Try to find if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            reporter_email ? { email: reporter_email } : null,
            { full_name: reporter_name }
          ].filter(Boolean)
        }
      });

      if (existingUser) {
        final_reporter_id = existingUser.user_id;
      } else {
        // Create new User
        const dummyEmail = reporter_email || `temp_${Date.now()}@helpdesk.local`;
        const newUser = await prisma.user.create({
          data: {
            full_name: reporter_name,
            email: dummyEmail,
            phone: reporter_phone || null,
            role: 'USER',
            bu_id: parseInt(bu_id)
          }
        });
        final_reporter_id = newUser.user_id;
      }
    }

    // Calculate SLA Deadline based on priority
    let slaHours = 24;
    const p = priority || 'Medium';
    if (p === 'Critical') slaHours = 2;
    else if (p === 'High') slaHours = 4;
    else if (p === 'Medium') slaHours = 24;
    else if (p === 'Low') slaHours = 72;

    const sla_deadline = new Date();
    sla_deadline.setHours(sla_deadline.getHours() + slaHours);

    const ticket = await prisma.ticket.create({
      data: {
        ticket_no,
        subject,
        problem_type,
        system_id: system_id ? parseInt(system_id) : null,
        hardware_id: hardware_id ? parseInt(hardware_id) : null,
        asset_id: (asset_id && asset_id !== 'other' && !isNaN(parseInt(asset_id))) ? parseInt(asset_id) : null,
        location_id: location_id ? parseInt(location_id) : null,
        location_text: location_text || null,
        reporter_id: final_reporter_id,
        reporter_name: reporter_name || null,
        reporter_email: reporter_email || null,
        reporter_phone: reporter_phone || null,
        reporter_line_id: reporter_line_id || null,
        bu_id: parseInt(bu_id),
        owner_id: system?.owner_user_id || null,
        priority: p,
        description,
        symptom,
        status: 'NEW',
        sla_deadline,
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
        user_id: reporter_id ? parseInt(reporter_id) : 1, // Fallback to system admin (1) if guest
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
