import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { generateTicketNo } from '@/lib/ticket-utils';

export async function POST(request) {
  try {
    const bodyText = await request.text();
    const signature = request.headers.get('x-line-signature');

    // Fetch config from DB
    const configs = await prisma.systemConfig.findMany({
      where: { config_key: { in: ['LINE_CHANNEL_SECRET', 'LINE_CHANNEL_ACCESS_TOKEN'] } }
    });
    const configMap = {};
    configs.forEach(c => configMap[c.config_key] = c.config_value);

    const channelSecret = (configMap['LINE_CHANNEL_SECRET'] || process.env.LINE_CHANNEL_SECRET || '').trim();
    if (channelSecret && signature) {
      const hash = crypto.createHmac('SHA256', channelSecret).update(bodyText).digest('base64');
      if (hash !== signature) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = JSON.parse(bodyText);
    
    if (!body.events || body.events.length === 0) {
      return NextResponse.json({ status: 'ok' });
    }

    const channelAccessToken = (configMap['LINE_CHANNEL_ACCESS_TOKEN'] || process.env.LINE_CHANNEL_ACCESS_TOKEN || '').trim();

    for (const event of body.events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const lineUserId = event.source.userId;
        const text = event.message.text;

        let activeTicket = null;
        let actualMessage = text;

        // 1. Try to match a ticket number in the message text
        const ticketNoMatch = text.match(/[A-Z0-9]{3,20}\d{8}\d{4,6}/i) || text.match(/TICKET-\d+/i);
        if (ticketNoMatch) {
          const ticketNo = ticketNoMatch[0].toUpperCase();
          const ticket = await prisma.ticket.findUnique({ where: { ticket_no: ticketNo } });
          if (ticket) {
            activeTicket = ticket;
            actualMessage = text.replace(ticketNoMatch[0], '').replace(/^[:\s\-]+/, '').trim();
            // Update ticket with the LINE User ID if not set or changed
            if (ticket.reporter_line_id !== lineUserId) {
              await prisma.ticket.update({
                where: { ticket_id: ticket.ticket_id },
                data: { reporter_line_id: lineUserId }
              });
            }
          }
        }

        // 2. If no explicit ticket matched, find the latest active ticket for this LINE user
        if (!activeTicket) {
          activeTicket = await prisma.ticket.findFirst({
            where: {
              reporter_line_id: lineUserId,
              status: { notIn: ['CLOSED', 'RESOLVED', 'CANCELLED'] }
            },
            orderBy: { created_at: 'desc' }
          });
        }

        // 3. If still no active ticket, automatically create a new one
        if (!activeTicket) {
          let displayName = 'LINE User';
          if (channelAccessToken) {
            try {
              const profileRes = await fetch(`https://api.line.me/v2/bot/profile/${lineUserId}`, {
                headers: { 'Authorization': `Bearer ${channelAccessToken}` }
              });
              if (profileRes.ok) {
                const profile = await profileRes.json();
                if (profile.displayName) {
                  displayName = profile.displayName;
                }
              }
            } catch (err) {
              console.error('Failed to fetch LINE profile:', err);
            }
          }

          // Get default Business Unit
          const defaultBu = await prisma.businessUnit.findFirst({ where: { is_active: true } });
          const buId = defaultBu ? defaultBu.bu_id : 1;
          const buCode = defaultBu ? defaultBu.bu_code : 'TWD';

          // Generate ticket number
          const ticket_no = await generateTicketNo(buCode, buId);

          // Create active ticket session
          activeTicket = await prisma.ticket.create({
            data: {
              ticket_no,
              subject: `แชตจาก LINE: ${displayName}`,
              problem_type: 'software',
              bu_id: buId,
              reporter_name: displayName,
              reporter_line_id: lineUserId,
              status: 'NEW',
              priority: 'Medium',
              description: `เปิดตั๋วแชตอัตโนมัติจากการทักทายผ่าน LINE ของ ${displayName}`,
              symptom: text
            }
          });
        }

        // 4. Save message under the active ticket
        if (activeTicket) {
          await prisma.ticketMessage.create({
            data: {
              ticket_id: activeTicket.ticket_id,
              sender_type: 'REPORTER',
              sender_id: null,
              sender_name: activeTicket.reporter_name || 'LINE User',
              message_text: actualMessage || text,
              source: 'LINE'
            }
          });
        }
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('LINE Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
