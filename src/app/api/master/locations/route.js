export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const locations = await prisma.location.findMany({
      include: { bu: true },
      orderBy: { location_code: 'asc' }
    });
    return NextResponse.json(locations);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const location = await prisma.location.create({
      data: {
        location_code: body.location_code,
        location_name: body.location_name,
        location_type: body.location_type,
        floor: body.floor || null,
        address: body.address || null,
        bu_id: body.bu_id ? Number(body.bu_id) : null,
        is_active: body.is_active !== undefined ? body.is_active : true,
      }
    });
    return NextResponse.json(location);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
