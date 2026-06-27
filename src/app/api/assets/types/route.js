import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const types = await prisma.assetType.findMany({
      where: { is_active: true },
      include: { _count: { select: { assets: true } } },
      orderBy: { type_name: 'asc' }
    });
    return NextResponse.json(types);
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    if (!data.type_code || !data.type_name)
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    const type = await prisma.assetType.create({
      data: {
        type_code:   data.type_code.toUpperCase().trim(),
        type_name:   data.type_name.trim(),
        icon:        data.icon || 'fa-box',
        description: data.description || null,
      }
    });
    return NextResponse.json(type, { status: 201 });
  } catch (e) {
    if (e.code === 'P2002') return NextResponse.json({ error: 'Code already exists' }, { status: 409 });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
