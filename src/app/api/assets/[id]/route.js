import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const asset = await prisma.asset.findUnique({
      where: { asset_id: parseInt(id) },
      include: {
        asset_type: true,
        location:   { select: { location_id: true, location_code: true, location_name: true, floor: true } },
        bu:         { select: { bu_id: true, bu_code: true, bu_name: true } },
        assignments: {
          orderBy: { assigned_at: 'desc' },
          select: {
            assignment_id: true, user_id: true, user_name: true,
            assigned_at: true, returned_at: true, note: true, assigned_by: true
          }
        },
        tickets: {
          orderBy: { created_at: 'desc' },
          select: {
            ticket_id: true,
            ticket_no: true,
            subject: true,
            status: true,
            priority: true,
            created_at: true,
            reporter_name: true,
            reporter: { select: { full_name: true } }
          }
        }
      }
    });
    if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(asset);
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const asset = await prisma.asset.update({
      where: { asset_id: parseInt(id) },
      data: {
        asset_code:    data.asset_code?.trim().toUpperCase(),
        asset_type_id: data.asset_type_id ? parseInt(data.asset_type_id) : undefined,
        brand:         data.brand  !== undefined ? (data.brand || null)  : undefined,
        model:         data.model  !== undefined ? (data.model || null)  : undefined,
        serial_no:     data.serial_no !== undefined ? (data.serial_no || null) : undefined,
        spec:          data.spec   !== undefined ? (data.spec || null)   : undefined,
        os:            data.os     !== undefined ? (data.os || null)     : undefined,
        mac_address:   data.mac_address !== undefined ? (data.mac_address || null) : undefined,
        ip_address:    data.ip_address  !== undefined ? (data.ip_address || null)  : undefined,
        purchase_date: data.purchase_date !== undefined ? (data.purchase_date ? new Date(data.purchase_date) : null) : undefined,
        warranty_end:  data.warranty_end  !== undefined ? (data.warranty_end  ? new Date(data.warranty_end)  : null) : undefined,
        cost:          data.cost !== undefined ? (data.cost != null ? parseFloat(data.cost) : null) : undefined,
        vendor:        data.vendor    !== undefined ? (data.vendor || null)    : undefined,
        po_number:     data.po_number !== undefined ? (data.po_number || null) : undefined,
        location_id:   data.location_id !== undefined ? (data.location_id ? parseInt(data.location_id) : null) : undefined,
        bu_id:         data.bu_id ? parseInt(data.bu_id) : undefined,
        status:        data.status || undefined,
        note:          data.note !== undefined ? (data.note || null) : undefined,
      }
    });
    return NextResponse.json(asset);
  } catch (e) {
    if (e.code === 'P2002') return NextResponse.json({ error: 'Code/Serial already exists' }, { status: 409 });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await prisma.asset.update({
      where: { asset_id: parseInt(id) },
      data: { is_active: false }
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
