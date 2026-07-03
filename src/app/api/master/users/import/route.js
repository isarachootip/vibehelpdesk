import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Pre-hash password '123456789' to save CPU time during bulk insert
const DEFAULT_PASSWORD_HASH = bcrypt.hashSync('123456789', 10);

export async function POST() {
  try {
    const jsonPath = path.join(process.cwd(), 'src', 'data', 'user_TW.json');
    if (!fs.existsSync(jsonPath)) {
      return NextResponse.json({ error: 'user_TW.json file not found in src/data.' }, { status: 404 });
    }

    const rawData = fs.readFileSync(jsonPath, 'utf-8');
    const userRows = JSON.parse(rawData);

    // Fetch existing active BUs and Locations
    const [dbBUs, dbLocations] = await Promise.all([
      prisma.businessUnit.findMany({ where: { is_active: true } }),
      prisma.location.findMany()
    ]);

    const buMap = new Map(dbBUs.map(b => [b.bu_code.toUpperCase(), b.bu_id]));
    const locMap = new Map(dbLocations.map(l => [l.location_code.toUpperCase(), l.location_id]));

    let successCount = 0;
    const errors = [];

    // Use a transaction or bulk insert if possible, but upsert row by row ensures we don't fail the whole import if one row has a bad format.
    // To make it faster, we process in chunks or standard loop.
    for (let i = 0; i < userRows.length; i++) {
      const row = userRows[i];
      const fullname = String(row.user_fullname || '').trim();
      const username = String(row.user_name || '').trim();
      let email = String(row.user_email || '').trim().toLowerCase();

      if (!email) {
        if (!username) {
          errors.push({ row: i + 1, message: 'Missing user_email and user_name' });
          continue;
        }
        email = `${username.toLowerCase()}@chg.co.th`;
      }

      const buCode = String(row.in_bu || '').trim().toUpperCase();
      const buId = buMap.get(buCode) || null;

      const storeCode = String(row.store_code || '').trim().toUpperCase();
      const locationId = locMap.get(storeCode) || null;

      const specialization = row.position_name ? String(row.position_name).trim() : null;

      const payload = {
        full_name: fullname || username || email.split('@')[0],
        bu_id: buId,
        location_id: locationId,
        role: 'USER',
        specialization,
        is_active: true
      };

      try {
        // Upsert by email (which is the unique field in User model)
        await prisma.user.upsert({
          where: { email },
          update: payload,
          create: {
            email,
            password: DEFAULT_PASSWORD_HASH,
            ...payload
          }
        });
        successCount++;
      } catch (err) {
        errors.push({ row: i + 1, email, message: err.message });
      }
    }

    return NextResponse.json({
      success: successCount,
      errors,
      total: userRows.length
    });
  } catch (error) {
    console.error('Import users error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
