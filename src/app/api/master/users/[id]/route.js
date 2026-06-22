import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const data = await request.json();
    
    const updateData = {
      email: data.email ? data.email.toLowerCase().trim() : undefined,
      full_name: data.full_name,
      phone: data.phone || null,
      role: data.role,
      bu_id: data.bu_id || null,
      location_id: data.location_id || null,
      is_active: data.is_active !== undefined ? data.is_active : true
    };
    
    if (data.password && data.password.trim() !== '') {
      updateData.password = data.password.trim();
    }

    const user = await prisma.user.update({
      where: { user_id: parseInt(id) },
      data: updateData
    });
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'อีเมลนี้ถูกใช้งานแล้วในระบบ' }, { status: 400 });
    }
    return NextResponse.json({ error: 'ไม่สามารถอัปเดตข้อมูลผู้ใช้ได้' }, { status: 500 });
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
