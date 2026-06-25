import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PUT update BU
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const bu = await prisma.businessUnit.update({
      where: { bu_id: parseInt(id) },
      data: { 
        bu_code: data.bu_code, 
        bu_name: data.bu_name, 
        bu_description: data.bu_description, 
        contact_person: data.contact_person,
        phone: data.phone,
        line_id: data.line_id,
        website: data.website,
        logo_url: data.logo_url !== undefined ? data.logo_url : undefined,
        is_active: data.is_active 
      },
    });
    return NextResponse.json(bu);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// DELETE
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await prisma.businessUnit.update({ where: { bu_id: parseInt(id) }, data: { is_active: false } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
