import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET all BUs
export async function GET() {
  try {
    const bus = await prisma.businessUnit.findMany({ orderBy: { bu_code: 'asc' } });
    return NextResponse.json(bus);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// POST create BU
export async function POST(request) {
  try {
    const { bu_code, bu_name, bu_description } = await request.json();
    if (!bu_code || !bu_name) return NextResponse.json({ error: 'bu_code and bu_name required' }, { status: 400 });

    const bu = await prisma.businessUnit.create({
      data: { bu_code, bu_name, bu_description },
    });
    return NextResponse.json(bu, { status: 201 });
  } catch (error) {
    if (error.code === 'P2002') return NextResponse.json({ error: 'BU code already exists' }, { status: 409 });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
