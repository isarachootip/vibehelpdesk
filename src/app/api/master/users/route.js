import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        user_id: true, full_name: true, email: true, phone: true,
        role: true, bu_id: true, specialization: true,
        bu: { select: { bu_code: true, bu_name: true } },
        location: { select: { location_code: true, location_name: true } }
      },
      orderBy: { full_name: 'asc' }
    });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    if (!data.email || !data.full_name || !data.role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const passwordToSave = data.password ? await bcrypt.hash(data.password, 10) : null;

    const user = await prisma.user.create({
      data: {
        email: data.email,
        full_name: data.full_name,
        phone: data.phone || null,
        role: data.role,
        password: passwordToSave,
        bu_id: data.bu_id || null,
        location_id: data.location_id || null
      }
    });
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error.code === 'P2002') return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
