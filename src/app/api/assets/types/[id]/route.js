import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const type = await prisma.assetType.update({
      where: { type_id: parseInt(id) },
      data: {
        type_code:   data.type_code?.toUpperCase().trim(),
        type_name:   data.type_name?.trim(),
        icon:        data.icon,
        description: data.description || null,
        is_active:   data.is_active !== undefined ? data.is_active : undefined,
      }
    });
    return NextResponse.json(type);
  } catch (e) {
    if (e.code === 'P2002') return NextResponse.json({ error: 'Code already exists' }, { status: 409 });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await prisma.assetType.update({
      where: { type_id: parseInt(id) },
      data: { is_active: false }
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
