import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(req, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await req.json();
    const location = await prisma.location.update({
      where: { location_id: Number(id) },
      data: {
        location_code: body.location_code,
        location_name: body.location_name,
        location_type: body.location_type,
        floor: body.floor || null,
        address: body.address || null,
        bu_id: body.bu_id ? Number(body.bu_id) : null,
        is_active: body.is_active,
      }
    });
    return NextResponse.json(location);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    // Soft delete
    const location = await prisma.location.update({
      where: { location_id: Number(id) },
      data: { is_active: false }
    });
    return NextResponse.json(location);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
