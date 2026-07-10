import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { generateTicketNo, normalizeTicketNo } from '@/lib/ticket-utils';

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
    
    // Save debug details to database
    try {
      const hash = channelSecret && signature 
        ? crypto.createHmac('sha256', channelSecret).update(bodyText).digest('base64')
        : null;

      await prisma.systemConfig.upsert({
        where: { config_key: 'LINE_VERIFY_DEBUG' },
        update: {
          config_value: JSON.stringify({
            timestamp: new Date().toISOString(),
            hasSignature: !!signature,
            hasChannelSecret: !!channelSecret,
            secretLength: channelSecret.length,
            headersSignature: signature,
            calculatedSignature: hash,
            match: hash === signature,
            bodyText: bodyText
          })
        },
        create: {
          config_key: 'LINE_VERIFY_DEBUG',
          config_value: JSON.stringify({
            timestamp: new Date().toISOString(),
            hasSignature: !!signature,
            hasChannelSecret: !!channelSecret,
            secretLength: channelSecret.length,
            headersSignature: signature,
            calculatedSignature: hash,
            match: hash === signature,
            bodyText: bodyText
          })
        }
      });

      if (channelSecret && signature && hash !== signature) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } catch (err) {
      console.error('Failed to process signature and save debug to DB:', err);
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
        const ticketNoMatch = text.match(/([A-Z0-9]{2,20}?)(\d{4}(?:20|25)\d{2})(\d{4,6})/i) || text.match(/TICKET-\d+/i);
        if (ticketNoMatch) {
          const ticketNo = normalizeTicketNo(ticketNoMatch[0].toUpperCase());
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

        // 3. If still no active ticket, reply to the user that they need an active ticket
        if (!activeTicket) {
          if (channelAccessToken && event.replyToken) {
            try {
              await fetch('https://api.line.me/v2/bot/message/reply', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${channelAccessToken}`
                },
                body: JSON.stringify({
                  replyToken: event.replyToken,
                  messages: [{
                    type: 'text',
                    text: `ขออภัยค่ะ ระบบไม่พบใบแจ้งงานที่กำลังดำเนินการของคุณ\n\nหากคุณเพิ่งแจ้งซ่อมหรือเปิดใบงาน กรุณาระบุเลขที่ใบงาน (เช่น TWDxxxxxxxx) เพื่อเริ่มต้นแชต หรือติดต่อเจ้าหน้าที่ IT Support เพื่อเปิดใบงานในระบบก่อนนะคะ`
                  }]
                })
              });
            } catch (replyErr) {
              console.error('Failed to send reply to LINE:', replyErr);
            }
          }
        } else {
          // 4. Save message under the active ticket
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
