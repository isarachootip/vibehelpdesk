import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const sys = await prisma.systemGroup.update({
      where: { system_id: parseInt(id) },
      data: {
        system_code: data.system_code, system_name: data.system_name,
        system_type: data.system_type, group_name: data.group_name,
        owner_user_id: data.owner_user_id ? parseInt(data.owner_user_id) : null,
        is_active: data.is_active,
      },
    });
    return NextResponse.json(sys);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await prisma.systemGroup.update({ where: { system_id: parseInt(id) }, data: { is_active: false } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
