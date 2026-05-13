import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const data = await request.json();
    
    const user = await prisma.user.update({
      where: { user_id: parseInt(id) },
      data: {
        full_name: data.full_name,
        phone: data.phone || null,
        role: data.role,
        bu_id: data.bu_id || null,
        location_id: data.location_id || null,
        is_active: data.is_active !== undefined ? data.is_active : true
      }
    });
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await prisma.user.update({
      where: { user_id: parseInt(id) },
      data: { is_active: false }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
