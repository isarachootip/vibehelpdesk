import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST() {
  try {
    // Find the BUs
    const auto1Bu = await prisma.businessUnit.findFirst({
      where: { bu_code: { equals: 'A1', mode: 'insensitive' } }
    });
    const twBu = await prisma.businessUnit.findFirst({
      where: { bu_code: { equals: 'TW', mode: 'insensitive' } }
    });

    if (!auto1Bu || !twBu) {
      return NextResponse.json({ error: 'Auto1 (A1) or Thaiwatsadu (TW) Business Unit not found in DB.' }, { status: 404 });
    }

    // 1. Update Auto1 locations (starts with 'Auto1' or 'Auto 1' or 'AUTO1')
    const updatedAuto1 = await prisma.location.updateMany({
      where: {
        OR: [
          { location_name: { startsWith: 'Auto1' } },
          { location_name: { startsWith: 'Auto 1' } },
          { location_name: { startsWith: 'AUTO1' } }
        ]
      },
      data: {
        bu_id: auto1Bu.bu_id
      }
    });

    // 2. Update TW locations (starts with 'TW')
    const updatedTw = await prisma.location.updateMany({
      where: {
        OR: [
          { location_name: { startsWith: 'TW' } },
          { location_name: { startsWith: 'tw' } },
          { location_name: { startsWith: 'Tw' } }
        ]
      },
      data: {
        bu_id: twBu.bu_id
      }
    });

    return NextResponse.json({
      success: true,
      auto1_updated_count: updatedAuto1.count,
      tw_updated_count: updatedTw.count
    });
  } catch (error) {
    console.error('Update location BUs error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
