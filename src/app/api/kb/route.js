import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search   = searchParams.get('search');
    const category = searchParams.get('category');

    const where = { is_active: true };
    if (category && category !== 'all') {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { title:   { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
    }

    const articles = await prisma.knowledgeBase.findMany({
      where,
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json(articles);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    if (!data.title || !data.content || !data.category) {
      return NextResponse.json({ error: 'Missing title, content, or category' }, { status: 400 });
    }

    const article = await prisma.knowledgeBase.create({
      data: {
        title:      data.title,
        content:    data.content,
        category:   data.category,
        created_by: data.created_by ? parseInt(data.created_by) : 1
      }
    });

    return NextResponse.json(article, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
