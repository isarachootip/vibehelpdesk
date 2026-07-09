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

    return NextResponse.json({
      status: 'success',
      environment: {
        LINE_CHANNEL_SECRET_env_exists: !!process.env.LINE_CHANNEL_SECRET,
        LINE_CHANNEL_ACCESS_TOKEN_env_exists: !!process.env.LINE_CHANNEL_ACCESS_TOKEN,
      },
      database: debugInfo
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
