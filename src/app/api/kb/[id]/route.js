import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    // Increment view count on fetch
    const article = await prisma.knowledgeBase.update({
      where: { id: parseInt(id) },
      data: { views: { increment: 1 } }
    });
    
    return NextResponse.json(article);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const data = await request.json();
    
    const article = await prisma.knowledgeBase.update({
      where: { id: parseInt(id) },
      data: {
        title:      data.title,
        content:    data.content,
        category:   data.category,
        is_active:  data.is_active !== undefined ? data.is_active : undefined
      }
    });
    
    return NextResponse.json(article);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    // Hard delete
    await prisma.knowledgeBase.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
