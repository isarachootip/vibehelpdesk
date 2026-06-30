import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const item = await prisma.recurringTicket.update({
      where: { id: parseInt(id) },
      data: {
        title:           data.title,
        subject:         data.subject,
        description:     data.description,
        priority:        data.priority,
        problem_type:    data.problem_type,
        bu_id:           data.bu_id ? parseInt(data.bu_id) : undefined,
        system_id:       data.system_id !== undefined ? (data.system_id ? parseInt(data.system_id) : null) : undefined,
        hardware_id:     data.hardware_id !== undefined ? (data.hardware_id ? parseInt(data.hardware_id) : null) : undefined,
        location_id:     data.location_id !== undefined ? (data.location_id ? parseInt(data.location_id) : null) : undefined,
        cron_expression: data.cron_expression,
        is_active:       data.is_active !== undefined ? data.is_active : undefined,
      }
    });
    return NextResponse.json(item);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await prisma.recurringTicket.delete({
      where: { id: parseInt(id) }
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
