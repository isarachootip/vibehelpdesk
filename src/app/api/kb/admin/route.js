import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET all articles (including inactive) — for admin use only
export async function GET(request) {
  try {
    const articles = await prisma.knowledgeBase.findMany({
      orderBy: { created_at: 'desc' },
    });
    return NextResponse.json(articles);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
