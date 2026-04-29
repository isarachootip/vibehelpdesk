import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PUT: Update an existing Business Unit
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const buId = parseInt(id, 10);
    const data = await request.json();

    if (isNaN(buId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const updatedBu = await prisma.businessUnit.update({
      where: { bu_id: buId },
      data: {
        bu_code: data.bu_code,
        bu_name: data.bu_name,
        bu_description: data.bu_description,
        is_active: data.is_active,
      },
    });

    return NextResponse.json(updatedBu);
  } catch (error) {
    console.error('Error updating Business Unit:', error);
    return NextResponse.json(
      { error: 'Failed to update Business Unit' },
      { status: 500 }
    );
  }
}

// DELETE: Remove a Business Unit
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const buId = parseInt(id, 10);

    if (isNaN(buId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    await prisma.businessUnit.delete({
      where: { bu_id: buId },
    });

    return NextResponse.json({ message: 'Business Unit deleted successfully' });
  } catch (error) {
    console.error('Error deleting Business Unit:', error);
    return NextResponse.json(
      { error: 'Failed to delete Business Unit (It might be in use)' },
      { status: 500 }
    );
  }
}
