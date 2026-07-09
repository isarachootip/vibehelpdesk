import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET all messages for a ticket
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const messages = await prisma.ticketMessage.findMany({
      where: { ticket_id: parseInt(id) },
      include: {
        sender: {
          select: { full_name: true, role: true, avatar_url: true }
        }
      },
      orderBy: { created_at: 'asc' }
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('GET /api/tickets/[id]/messages error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST a new message to a ticket
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { sender_type, sender_id, sender_name, message_text, source } = body;

    if (!message_text) {
      return NextResponse.json({ error: 'Message text is required' }, { status: 400 });
    }

    // Verify ticket exists
    const ticket = await prisma.ticket.findUnique({ where: { ticket_id: parseInt(id) } });
    
    // Save API hit details to DB for debugging
    try {
      await prisma.systemConfig.upsert({
        where: { config_key: 'LINE_PUSH_DEBUG' },
        update: {
          config_value: JSON.stringify({
            timestamp: new Date().toISOString(),
            status: 'api_hit',
            sender_type: sender_type || 'REPORTER',
            ticket_found: !!ticket,
            reporter_line_id: ticket?.reporter_line_id || null,
            reporter_line_id_length: ticket?.reporter_line_id?.length || 0,
            reporter_line_id_starts_with_u: ticket?.reporter_line_id?.startsWith('U') || false,
            ticket_no: ticket?.ticket_no || null,
            message_text
          })
        },
        create: {
          config_key: 'LINE_PUSH_DEBUG',
          config_value: JSON.stringify({
            timestamp: new Date().toISOString(),
            status: 'api_hit',
            sender_type: sender_type || 'REPORTER',
            ticket_found: !!ticket,
            reporter_line_id: ticket?.reporter_line_id || null,
            reporter_line_id_length: ticket?.reporter_line_id?.length || 0,
            reporter_line_id_starts_with_u: ticket?.reporter_line_id?.startsWith('U') || false,
            ticket_no: ticket?.ticket_no || null,
            message_text
          })
        }
      });
    } catch (dbErr) {
      console.error('Failed to write api_hit log:', dbErr);
    }

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const message = await prisma.ticketMessage.create({
      data: {
        ticket_id: parseInt(id),
        sender_type: sender_type || 'REPORTER',
        sender_id: sender_id ? parseInt(sender_id) : null,
        sender_name: sender_name || null,
        message_text,
        source: source || 'WEB'
      },
      include: {
        sender: {
          select: { full_name: true, role: true, avatar_url: true }
        }
      }
    });

    // Push message to LINE OA if sender is AGENT and we have a valid LINE user ID
    if (sender_type === 'AGENT' && ticket.reporter_line_id && ticket.reporter_line_id.startsWith('U') && ticket.reporter_line_id.length === 33) {
      const config = await prisma.systemConfig.findUnique({
        where: { config_key: 'LINE_CHANNEL_ACCESS_TOKEN' }
      });
      const channelAccessToken = (config?.config_value || process.env.LINE_CHANNEL_ACCESS_TOKEN || '').trim();
      
      if (channelAccessToken) {
        try {
          const pushPayload = {
            to: ticket.reporter_line_id,
            messages: [{
              type: 'text',
              text: `[อัปเดตจาก IT Support]\nTicket: ${ticket.ticket_no}\nข้อความ: ${message_text}`
            }]
          };

          const lineRes = await fetch('https://api.line.me/v2/bot/message/push', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${channelAccessToken}`
            },
            body: JSON.stringify(pushPayload)
          });

          const lineResBody = await lineRes.text();

          // Save debug logs to DB
          await prisma.systemConfig.upsert({
            where: { config_key: 'LINE_PUSH_DEBUG' },
            update: {
              config_value: JSON.stringify({
                timestamp: new Date().toISOString(),
                status: lineRes.status,
                body: lineResBody,
                payload: pushPayload,
                tokenLength: channelAccessToken.length
              })
            },
            create: {
              config_key: 'LINE_PUSH_DEBUG',
              config_value: JSON.stringify({
                timestamp: new Date().toISOString(),
                status: lineRes.status,
                body: lineResBody,
                payload: pushPayload,
                tokenLength: channelAccessToken.length
              })
            }
          });
        } catch (pushErr) {
          console.error('Failed to push to LINE:', pushErr);
        }
      }
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('POST /api/tickets/[id]/messages error:', error);
    return NextResponse.json({ 
      error: 'Failed to send message', 
      message: error.message, 
      stack: error.stack 
    }, { status: 500 });
  }
}
