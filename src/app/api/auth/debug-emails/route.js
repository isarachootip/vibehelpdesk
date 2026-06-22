import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== 'seethismess') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      select: {
        user_id: true,
        email: true,
        full_name: true,
        role: true,
        is_active: true,
      },
      orderBy: { email: 'asc' },
    });

    return NextResponse.json({
      count: users.length,
      users: users,
    });
  } catch (error) {
    console.error('GET /api/auth/debug-emails error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
