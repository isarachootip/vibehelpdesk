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
    
    // Verify token
    let payload;
    try {
      const { payload: verifiedPayload } = await jose.jwtVerify(token, JWT_SECRET);
      payload = verifiedPayload;
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { user_id: payload.userId },
      include: {
        bu: { select: { bu_code: true, bu_name: true } },
        location: { select: { location_code: true, location_name: true } }
      }
    });

    if (!user || !user.is_active) {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }

    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({ user: userWithoutPassword });

  } catch (error) {
    console.error('GET /api/auth/me error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดของระบบ' },
      { status: 500 }
    );
  }
}
