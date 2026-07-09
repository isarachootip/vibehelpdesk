import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import * as jose from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super-secret-key-12345'
);

export async function GET() {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('hd_token');

    if (!tokenCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { value: token } = tokenCookie;
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { user_id: payload.userId }
    });

    if (!user || user.email !== 'isarachootip@gmail.com') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Read values from DB
    const configs = await prisma.systemConfig.findMany({
      where: { config_key: { in: ['LINE_CHANNEL_SECRET', 'LINE_CHANNEL_ACCESS_TOKEN'] } }
    });

    const debugInfo = {};
    configs.forEach(c => {
      const val = c.config_value || '';
      const len = val.length;
      if (len > 0) {
        debugInfo[c.config_key] = {
          length: len,
          start: val.substring(0, 4),
          end: val.substring(len - 4),
          raw_value_trimmed: val.trim() === val ? "Yes" : "No (has spaces)"
        };
      } else {
        debugInfo[c.config_key] = { status: 'empty' };
      }
    });

    // Read verify debug info from DB
    const debugRecord = await prisma.systemConfig.findUnique({
      where: { config_key: 'LINE_VERIFY_DEBUG' }
    });
    const verifyDebug = debugRecord ? JSON.parse(debugRecord.config_value) : { status: 'no_verify_triggered_yet' };

    // Read push debug info from DB
    const pushRecord = await prisma.systemConfig.findUnique({
      where: { config_key: 'LINE_PUSH_DEBUG' }
    });
    const pushDebug = pushRecord ? JSON.parse(pushRecord.config_value) : { status: 'no_push_triggered_yet' };

    // Fetch last 10 tickets
    const recentTickets = await prisma.ticket.findMany({
      orderBy: { created_at: 'desc' },
      take: 10
    });

    // Fetch last 10 messages
    const recentMessages = await prisma.ticketMessage.findMany({
      orderBy: { created_at: 'desc' },
      take: 10
    });

    return NextResponse.json({
      status: 'success',
      environment: {
        LINE_CHANNEL_SECRET_env_exists: !!process.env.LINE_CHANNEL_SECRET,
        LINE_CHANNEL_ACCESS_TOKEN_env_exists: !!process.env.LINE_CHANNEL_ACCESS_TOKEN,
      },
      database: debugInfo,
      last_verify_attempt: verifyDebug,
      last_push_attempt: pushDebug,
      recent_tickets: recentTickets.map(t => ({
        ticket_id: t.ticket_id,
        ticket_no: t.ticket_no,
        subject: t.subject,
        reporter_line_id: t.reporter_line_id,
        status: t.status,
        created_at: t.created_at
      })),
      recent_messages: recentMessages
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
