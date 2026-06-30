import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import parser from 'cron-parser';
import { generateTicketNo } from '@/lib/ticket-utils';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  return handleTrigger(request);
}

export async function POST(request) {
  return handleTrigger(request);
}

async function handleTrigger(request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    
    // Optional cron key protection
    const cronKey = process.env.CRON_SECRET || 'chg_cron_secret_123';
    if (key && key !== cronKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activeRecs = await prisma.recurringTicket.findMany({
      where: { is_active: true }
    });

    const now = new Date();
    const spawned = [];
    const errors = [];

    for (const rec of activeRecs) {
      try {
        const interval = parser.parseExpression(rec.cron_expression);
        const lastExpectedRun = interval.prev().toDate();
        const lastRun = rec.last_triggered_at ? new Date(rec.last_triggered_at) : new Date(rec.created_at);

        // If the last expected execution time is newer than our last recorded execution, it's time to run!
        if (!rec.last_triggered_at || lastExpectedRun > lastRun) {
          console.log(`Triggering recurring ticket: ${rec.title}`);
          
          // Get BU code for ticket number
          const bu = await prisma.businessUnit.findUnique({ where: { bu_id: rec.bu_id } });
          if (!bu) throw new Error(`Business Unit with ID ${rec.bu_id} not found`);

          const ticket_no = await generateTicketNo(bu.bu_code, bu.bu_id);

          // Calculate SLA deadline
          let slaHours = 24;
          if (rec.priority === 'Critical') slaHours = 2;
          else if (rec.priority === 'High') slaHours = 4;
          else if (rec.priority === 'Medium') slaHours = 24;
          else if (rec.priority === 'Low') slaHours = 72;

          const sla_deadline = new Date();
          sla_deadline.setHours(sla_deadline.getHours() + slaHours);

          // Create ticket in db
          const ticket = await prisma.ticket.create({
            data: {
              ticket_no,
              subject: `[PM] ${rec.subject}`,
              problem_type: rec.problem_type,
              priority: rec.priority,
              description: rec.description,
              symptom: `งานบำรุงรักษาประจำรอบ (ตามตารางเวลา: ${rec.cron_expression})`,
              bu_id: rec.bu_id,
              system_id: rec.system_id,
              hardware_id: rec.hardware_id,
              location_id: rec.location_id,
              reporter_name: 'ระบบบำรุงรักษาอัตโนมัติ',
              reporter_email: 'automated-pm@helpdesk.local',
              status: 'NEW',
              sla_deadline,
            }
          });

          // Update last triggered time
          await prisma.recurringTicket.update({
            where: { id: rec.id },
            data: { last_triggered_at: now }
          });

          // Create audit log
          await prisma.auditLog.create({
            data: {
              ticket_id: ticket.ticket_id,
              user_id: 1, // Admin / System
              action: 'CREATE',
              detail: `ตั๋วบำรุงรักษาประจำรอบ ${ticket_no} ถูกสร้างขึ้นอัตโนมัติ`,
              new_value: JSON.stringify({ status: 'NEW', priority: rec.priority }),
            }
          });

          spawned.push({ id: rec.id, ticket_no, subject: ticket.subject });
        }
      } catch (err) {
        console.error(`Failed to process recurring ticket ${rec.id}:`, err);
        errors.push({ id: rec.id, error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      processed: activeRecs.length,
      spawned,
      errors
    });

  } catch (e) {
    console.error('Cron trigger error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
