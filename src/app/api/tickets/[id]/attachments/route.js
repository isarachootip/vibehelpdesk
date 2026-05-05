import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { file_name, file_url, file_type, file_size, uploaded_by } = await request.json();

    const attachment = await prisma.attachment.create({
      data: {
        ticket_id: parseInt(id),
        file_name,
        file_url,
        file_type,
        file_size,
        uploaded_by: uploaded_by || 1,
      },
    });

    return NextResponse.json(attachment, { status: 201 });
  } catch (error) {
    console.error('Attachment error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
