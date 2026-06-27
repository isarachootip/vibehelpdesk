import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
export const dynamic = 'force-dynamic';

const assetInclude = {
  asset_type:  { select: { type_id: true, type_code: true, type_name: true, icon: true } },
  location:    { select: { location_id: true, location_code: true, location_name: true } },
  bu:          { select: { bu_id: true, bu_code: true, bu_name: true } },
  assignments: {
    where: { returned_at: null },
    orderBy: { assigned_at: 'desc' },
    take: 1,
    select: { assignment_id: true, user_id: true, user_name: true, assigned_at: true, note: true }
  }
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search      = searchParams.get('search');
    const status      = searchParams.get('status');
    const type_id     = searchParams.get('type_id');
    const location_id = searchParams.get('location_id');
    const bu_id       = searchParams.get('bu_id');

    const where = { is_active: true };
    if (status)      where.status = status;
    if (type_id)     where.asset_type_id = parseInt(type_id);
    if (location_id) where.location_id   = parseInt(location_id);
    if (bu_id)       where.bu_id         = parseInt(bu_id);
    if (search) {
      where.OR = [
        { asset_code: { contains: search, mode: 'insensitive' } },
        { serial_no:  { contains: search, mode: 'insensitive' } },
        { brand:      { contains: search, mode: 'insensitive' } },
        { model:      { contains: search, mode: 'insensitive' } },
        { ip_address: { contains: search, mode: 'insensitive' } },
        { mac_address:{ contains: search, mode: 'insensitive' } },
      ];
    }

    const assets = await prisma.asset.findMany({
      where,
      include: assetInclude,
      orderBy: { asset_code: 'asc' }
    });
    return NextResponse.json(assets);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    if (!data.asset_code || !data.asset_type_id)
      return NextResponse.json({ error: 'Asset code and type are required' }, { status: 400 });

    const asset = await prisma.asset.create({
      data: {
        asset_code:    data.asset_code.trim().toUpperCase(),
        asset_type_id: parseInt(data.asset_type_id),
        brand:         data.brand || null,
        model:         data.model || null,
        serial_no:     data.serial_no || null,
        spec:          data.spec || null,
        os:            data.os || null,
        mac_address:   data.mac_address || null,
        ip_address:    data.ip_address || null,
        purchase_date: data.purchase_date ? new Date(data.purchase_date) : null,
        warranty_end:  data.warranty_end  ? new Date(data.warranty_end)  : null,
        cost:          data.cost != null  ? parseFloat(data.cost) : null,
        vendor:        data.vendor || null,
        po_number:     data.po_number || null,
        location_id:   data.location_id ? parseInt(data.location_id) : null,
        bu_id:         data.bu_id       ? parseInt(data.bu_id)       : null,
        status:        data.status || 'IN_USE',
        note:          data.note || null,
      }
    });

    // Create initial assignment if provided
    if (data.assign_user_id || data.assign_user_name) {
      await prisma.assetAssignment.create({
        data: {
          asset_id:   asset.asset_id,
          user_id:    data.assign_user_id   || null,
          user_name:  data.assign_user_name || null,
          location_id: data.location_id ? parseInt(data.location_id) : null,
          note:       data.assign_note || null,
        }
      });
    }

    return NextResponse.json(asset, { status: 201 });
  } catch (e) {
    console.error(e);
    if (e.code === 'P2002') {
      const field = e.meta?.target?.includes('serial_no') ? 'Serial Number' : 'Asset Code';
      return NextResponse.json({ error: `${field} นี้มีอยู่ในระบบแล้ว` }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 });
  }
}
