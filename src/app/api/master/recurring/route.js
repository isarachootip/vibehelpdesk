import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const list = await prisma.recurringTicket.findMany({
      orderBy: { created_at: 'desc' }
    });
    return NextResponse.json(list);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    if (!data.title || !data.subject || !data.description || !data.cron_expression || !data.bu_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const item = await prisma.recurringTicket.create({
      data: {
        title:           data.title,
        subject:         data.subject,
        description:     data.description,
        priority:        data.priority || 'Medium',
        problem_type:    data.problem_type || 'hardware',
        bu_id:           parseInt(data.bu_id),
        system_id:       data.system_id ? parseInt(data.system_id) : null,
        hardware_id:     data.hardware_id ? parseInt(data.hardware_id) : null,
        location_id:     data.location_id ? parseInt(data.location_id) : null,
        cron_expression: data.cron_expression,
        is_active:       data.is_active !== undefined ? data.is_active : true,
      }
    });

    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
