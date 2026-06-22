import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // In a real app, verify Admin role here
    
    const configs = await prisma.systemConfig.findMany({
      orderBy: { config_key: 'asc' }
    });

    return NextResponse.json(configs);
  } catch (error) {
    console.error('GET /api/settings error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // In a real app, verify Admin role here
    
    const body = await request.json();
    const { configs } = body;

    if (!Array.isArray(configs)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    // Upsert each config
    const results = [];
    for (const conf of configs) {
      if (!conf.config_key) continue;
      
      const updated = await prisma.systemConfig.upsert({
        where: { config_key: conf.config_key },
        update: { 
          config_value: conf.config_value,
          description: conf.description,
          is_secret: conf.is_secret !== undefined ? conf.is_secret : false,
          updated_by: 1 // Admin Demo
        },
        create: {
          config_key: conf.config_key,
          config_value: conf.config_value,
          description: conf.description,
          is_secret: conf.is_secret !== undefined ? conf.is_secret : false,
          updated_by: 1 // Admin Demo
        }
      });
      results.push(updated);
    }

    return NextResponse.json({ success: true, updatedCount: results.length });
  } catch (error) {
    console.error('POST /api/settings error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
