import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';

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

    const channelSecret = configMap['LINE_CHANNEL_SECRET'] || process.env.LINE_CHANNEL_SECRET;
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

    const channelAccessToken = configMap['LINE_CHANNEL_ACCESS_TOKEN'] || process.env.LINE_CHANNEL_ACCESS_TOKEN;

    for (const event of body.events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const lineUserId = event.source.userId;
        const text = event.message.text;
        const replyToken = event.replyToken;

        let ticketId = null;
        let actualMessage = text;
        let ticketNoStr = "";

        const match = text.match(/TICKET-\d+/i);
        if (match) {
          const ticketNo = match[0].toUpperCase();
          const ticket = await prisma.ticket.findUnique({ where: { ticket_no: ticketNo } });
          if (ticket) {
            ticketId = ticket.ticket_id;
            ticketNoStr = ticket.ticket_no;
            actualMessage = text.replace(match[0], '').replace(/^:\s*/, '').trim();

            // Update ticket with the actual LINE User ID so we can Push to them later
            if (ticket.reporter_line_id !== lineUserId) {
              await prisma.ticket.update({
                where: { ticket_id: ticketId },
                data: { reporter_line_id: lineUserId }
              });
            }
          }
        } else {
          // Find the latest ticket where reporter_line_id matches this LINE User ID
          const latestTicket = await prisma.ticket.findFirst({
            where: { reporter_line_id: lineUserId },
            orderBy: { created_at: 'desc' }
          });
          if (latestTicket) {
            ticketId = latestTicket.ticket_id;
            ticketNoStr = latestTicket.ticket_no;
          }
        }

        if (ticketId) {
          if (actualMessage) {
            await prisma.ticketMessage.create({
              data: {
                ticket_id: ticketId,
                sender_type: 'REPORTER',
                sender_id: null,
                sender_name: 'LINE User', 
                message_text: actualMessage,
                source: 'LINE'
              }
            });
          }
        } else {
          // Tell them to provide a ticket number
          if (channelAccessToken && replyToken) {
            await fetch('https://api.line.me/v2/bot/message/reply', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${channelAccessToken}`
              },
              body: JSON.stringify({
                replyToken,
                messages: [{
                  type: 'text',
                  text: 'กรุณาระบุหมายเลข Ticket ที่ต้องการติดต่อ เช่น "TICKET-12345: สวัสดีครับ"'
                }]
              })
            });
          }
        }
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('LINE Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
