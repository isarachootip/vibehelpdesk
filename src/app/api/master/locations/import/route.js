import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export async function POST() {
  try {
    const jsonPath = path.join(process.cwd(), 'src', 'data', 'store_CHG.json');
    if (!fs.existsSync(jsonPath)) {
      return NextResponse.json({ error: 'store_CHG.json file not found in src/data.' }, { status: 404 });
    }

    const rawData = fs.readFileSync(jsonPath, 'utf-8');
    const storeRows = JSON.parse(rawData);

    // Fetch existing active BUs
    const dbBUs = await prisma.businessUnit.findMany({
      where: { is_active: true }
    });
    const buMap = new Map(dbBUs.map(b => [b.bu_code.toUpperCase(), b.bu_id]));

    let successCount = 0;
    const errors = [];

    for (let i = 0; i < storeRows.length; i++) {
      const row = storeRows[i];
      const storeCode = String(row.store_code || '').trim();
      const storeName = String(row.store_name_th || '').trim();

      if (!storeCode || !storeName) {
        errors.push({ row: i + 1, message: 'Missing store_code or store_name_th' });
        continue;
      }

      // Map BU
      const excelBu = String(row.in_bu || '').trim().toUpperCase();
      const buId = buMap.get(excelBu) || null;

      // Determine Location Type
      const nameLower = storeName.toLowerCase();
      let locationType = 'store';
      if (nameLower.includes('คลัง') || nameLower.includes('dc') || nameLower.includes('distribution') || nameLower.includes('logistics')) {
        locationType = 'warehouse';
      }

      const payload = {
        location_name: storeName,
        location_type: locationType,
        address: row.formal_address_th ? String(row.formal_address_th).trim() : null,
        bu_id: buId,
        is_active: true
      };

      try {
        await prisma.location.upsert({
          where: { location_code: storeCode },
          update: payload,
          create: { location_code: storeCode, ...payload }
        });
        successCount++;
      } catch (err) {
        errors.push({ row: i + 1, storeCode, message: err.message });
      }
    }

    return NextResponse.json({
      success: successCount,
      errors,
      total: storeRows.length
    });
  } catch (error) {
    console.error('Import locations error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
