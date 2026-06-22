import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail, getTicketEmailTemplate } from '@/lib/email';

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

    // Send email notification to reporter in background
    const emailTo = ticket.reporter?.email || ticket.reporter_email;
    const nameTo = ticket.reporter?.full_name || ticket.reporter_name;
    
    if (emailTo) {
      let emailSubject = '';
      let updateTitle = '';
      let updateDetails = '';

      switch (action) {
        case 'TIER1_ACCEPT':
          emailSubject = `[IT Helpdesk] รับเรื่องแจ้งปัญหาแล้ว - ${ticket.ticket_no}`;
          updateTitle = 'เจ้าหน้าที่รับเรื่องเรียบร้อยแล้ว';
          updateDetails = `เจ้าหน้าที่ IT ได้รับเรื่องแจ้งปัญหาของท่านเข้าระบบแล้ว และกำลังอยู่ในขั้นตอนประเมินหาสาเหตุครับ`;
          break;
        case 'TIER1_ASSESS':
          emailSubject = `[IT Helpdesk] ผลการประเมินความคืบหน้า - ${ticket.ticket_no}`;
          updateTitle = 'อัปเดตผลการประเมินและการแก้ไขเบื้องต้น';
          updateDetails = `ผลการประเมินเบื้องต้น:\n${ticket.initial_assessment || '-'}\n\nสาเหตุที่คาดว่าจะเป็น:\n${ticket.preliminary_cause || '-'}\n\nสิ่งที่ได้ดำเนินการไปแล้ว:\n${ticket.tier1_action || '-'}`;
          break;
        case 'ESCALATE':
          emailSubject = `[IT Helpdesk] ส่งเรื่องต่อไปยัง Tier 2 - ${ticket.ticket_no}`;
          updateTitle = 'ส่งเรื่องต่อให้ผู้เชี่ยวชาญ Tier 2 (Escalated)';
          updateDetails = `ปัญหาของท่านมีความจำเป็นต้องได้รับการตรวจสอบโดยทีมผู้เชี่ยวชาญ Tier 2\n\nเหตุผลการส่งต่อ: ${ticket.escalate_reason || '-'}`;
          break;
        case 'RESOLVE':
          emailSubject = `[IT Helpdesk] แก้ไขปัญหาเสร็จสิ้น - ${ticket.ticket_no}`;
          updateTitle = 'ปัญหาของท่านได้รับการแก้ไขเสร็จสิ้นเรียบร้อย';
          updateDetails = `ผลการแก้ไขปัญหา:\n${ticket.resolution || '-'}\n\nกรุณาเข้าสู่ระบบเพื่อตรวจสอบงานและกดยืนยันปิดงาน หรือแชทสอบถามเจ้าหน้าที่เพิ่มเติมได้ครับ`;
          break;
        case 'CONFIRM':
          emailSubject = `[IT Helpdesk] ปิดงานเสร็จสมบูรณ์ - ${ticket.ticket_no}`;
          updateTitle = 'ปิดงาน (Closed) เรียบร้อย';
          updateDetails = `ขอบคุณที่ใช้บริการ IT Helpdesk ทางเราได้ทำการปิดงาน Ticket นี้ในระบบเรียบร้อยแล้วครับ\nระดับความพึงพอใจ: ${ticket.user_satisfaction ? '⭐'.repeat(ticket.user_satisfaction) : '-'}`;
          break;
        case 'REOPEN':
          emailSubject = `[IT Helpdesk] เปิดงานอีกครั้ง - ${ticket.ticket_no}`;
          updateTitle = 'เปิดงานอีกครั้ง (Reopened)';
          updateDetails = `ทิคเก็ตนี้ได้รับการเปิดเพื่อดึงกลับมาดำเนินการตรวจสอบเพิ่มเติมใหม่อีกครั้งแล้วครับ`;
          break;
        case 'CANCEL':
          emailSubject = `[IT Helpdesk] ยกเลิกคำขอ - ${ticket.ticket_no}`;
          updateTitle = 'ยกเลิกรายการแจ้งปัญหา (Cancelled)';
          updateDetails = `รายการแจ้งปัญหาเลขที่ ${ticket.ticket_no} ได้รับการยกเลิกเรียบร้อยแล้ว`;
          break;
      }

      if (emailSubject) {
        try {
          const html = getTicketEmailTemplate({
            ticketNo: ticket.ticket_no,
            subject: ticket.subject,
            status: ticket.status,
            updateTitle,
            updateDetails,
            reporterName: nameTo
          });
          
          // Execute async and catch errors to prevent blocking
          sendEmail({ to: emailTo, subject: emailSubject, html }).catch(err => {
            console.error('Background sendEmail failed:', err);
          });
        } catch (e) {
          console.error('Failed to construct email template:', e);
        }
      }
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error('PUT /api/tickets/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 });
  }
}
