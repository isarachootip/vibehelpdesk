import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST: assign asset to user — closes previous open assignment first
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const data = await request.json();

    // Close any open assignment
    await prisma.assetAssignment.updateMany({
      where: { asset_id: parseInt(id), returned_at: null },
      data:  { returned_at: new Date() }
    });

    // Create new assignment
    const assignment = await prisma.assetAssignment.create({
      data: {
        asset_id:    parseInt(id),
        user_id:     data.user_id    ? parseInt(data.user_id) : null,
        user_name:   data.user_name  || null,
        location_id: data.location_id ? parseInt(data.location_id) : null,
        note:        data.note       || null,
        assigned_by: data.assigned_by ? parseInt(data.assigned_by) : null,
      }
    });

    // Update asset location if provided
    if (data.location_id) {
      await prisma.asset.update({
        where: { asset_id: parseInt(id) },
        data:  { location_id: parseInt(data.location_id) }
      });
    }

    return NextResponse.json(assignment, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to assign asset' }, { status: 500 });
  }
}

// DELETE: return asset (close assignment)
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await prisma.assetAssignment.updateMany({
      where: { asset_id: parseInt(id), returned_at: null },
      data:  { returned_at: new Date() }
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
