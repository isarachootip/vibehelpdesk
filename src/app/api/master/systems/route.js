import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const systems = await prisma.systemGroup.findMany({
      include: { owner_user: { select: { user_id: true, full_name: true, email: true } } },
      orderBy: { system_code: 'asc' },
    });
    return NextResponse.json(systems);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { system_code, system_name, system_type, group_name, owner_user_id } = await request.json();
    if (!system_code || !system_name) return NextResponse.json({ error: 'system_code and system_name required' }, { status: 400 });

    const sys = await prisma.systemGroup.create({
      data: { system_code, system_name, system_type: system_type || 'software', group_name, owner_user_id: owner_user_id ? parseInt(owner_user_id) : null },
    });
    return NextResponse.json(sys, { status: 201 });
  } catch (error) {
    if (error.code === 'P2002') return NextResponse.json({ error: 'System code already exists' }, { status: 409 });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
