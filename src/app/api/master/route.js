import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET all master data for dropdowns (BU, Systems, Locations, Users)
export async function GET() {
  try {
    const [bus, systems, locations, users] = await Promise.all([
      prisma.businessUnit.findMany({ where: { is_active: true }, orderBy: { bu_code: 'asc' } }),
      prisma.systemGroup.findMany({
        where: { is_active: true },
        include: { owner_user: { select: { user_id: true, full_name: true, email: true } } },
        orderBy: { system_code: 'asc' },
      }),
      prisma.location.findMany({ where: { is_active: true }, orderBy: { location_code: 'asc' } }),
      prisma.user.findMany({
        where: { is_active: true },
        select: { user_id: true, full_name: true, email: true, role: true, bu_id: true },
        orderBy: { full_name: 'asc' },
      }),
    ]);

    return NextResponse.json({ bus, systems, locations, users });
  } catch (error) {
    console.error('GET /api/master error:', error);
    return NextResponse.json({ error: 'Failed to fetch master data' }, { status: 500 });
  }
}
