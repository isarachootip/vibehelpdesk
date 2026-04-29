import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Fetch all Business Units
export async function GET() {
  try {
    const bus = await prisma.businessUnit.findMany({
      orderBy: { created_at: 'desc' },
    });
    return NextResponse.json(bus);
  } catch (error) {
    console.error('Error fetching Business Units:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Business Units' },
      { status: 500 }
    );
  }
}

// POST: Create a new Business Unit
export async function POST(request) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.bu_code || !data.bu_name) {
      return NextResponse.json(
        { error: 'bu_code and bu_name are required' },
        { status: 400 }
      );
    }

    const newBu = await prisma.businessUnit.create({
      data: {
        bu_code: data.bu_code,
        bu_name: data.bu_name,
        bu_description: data.bu_description || null,
        is_active: data.is_active ?? true,
      },
    });

    return NextResponse.json(newBu, { status: 201 });
  } catch (error) {
    console.error('Error creating Business Unit:', error);
    return NextResponse.json(
      { error: 'Failed to create Business Unit' },
      { status: 500 }
    );
  }
}
