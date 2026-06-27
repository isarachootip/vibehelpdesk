import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const buffer  = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
    const sheet   = workbook.Sheets[workbook.SheetNames[0]];
    const rows    = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    let successCount = 0;
    const errors = [];

    // Pre-load lookup tables
    const [assetTypes, locations, bus] = await Promise.all([
      prisma.assetType.findMany({ select: { type_id: true, type_code: true } }),
      prisma.location.findMany({ select: { location_id: true, location_code: true } }),
      prisma.businessUnit.findMany({ select: { bu_id: true, bu_code: true } }),
    ]);

    const typeMap     = Object.fromEntries(assetTypes.map(t => [t.type_code.toUpperCase(),  t.type_id]));
    const locationMap = Object.fromEntries(locations.map(l =>  [l.location_code.toUpperCase(), l.location_id]));
    const buMap       = Object.fromEntries(bus.map(b =>        [b.bu_code.toUpperCase(),     b.bu_id]));

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Excel row number (1-indexed + header)

      const assetCode = String(row['asset_code'] || '').trim().toUpperCase();
      if (!assetCode) { errors.push({ row: rowNum, message: 'asset_code is required' }); continue; }

      const typeCode    = String(row['asset_type_code'] || '').trim().toUpperCase();
      const asset_type_id = typeMap[typeCode];
      if (!asset_type_id) { errors.push({ row: rowNum, message: `asset_type_code "${typeCode}" not found` }); continue; }

      const locationCode = String(row['location_code'] || '').trim().toUpperCase();
      const location_id  = locationMap[locationCode] || null;

      const buCode = String(row['bu_code'] || '').trim().toUpperCase();
      const bu_id  = buMap[buCode] || null;

      // Parse dates (XLSX may return Date objects or strings)
      const parseDate = (v) => {
        if (!v || v === '') return null;
        if (v instanceof Date) return v;
        const d = new Date(v);
        return isNaN(d.getTime()) ? null : d;
      };

      const parseDecimal = (v) => {
        const n = parseFloat(String(v).replace(/,/g, ''));
        return isNaN(n) ? null : n;
      };

      const statusVal = String(row['status'] || 'IN_USE').trim().toUpperCase();
      const validStatuses = ['IN_USE', 'SPARE', 'REPAIR', 'RETIRED', 'LOST'];
      const status = validStatuses.includes(statusVal) ? statusVal : 'IN_USE';

      const payload = {
        asset_type_id,
        brand:         String(row['brand']      || '').trim() || null,
        model:         String(row['model']      || '').trim() || null,
        serial_no:     String(row['serial_no']  || '').trim() || null,
        spec:          String(row['spec']       || '').trim() || null,
        os:            String(row['os']         || '').trim() || null,
        location_id,
        bu_id,
        status,
        purchase_date: parseDate(row['purchase_date']),
        warranty_end:  parseDate(row['warranty_end']),
        cost:          parseDecimal(row['cost']),
        vendor:        String(row['vendor']     || '').trim() || null,
        po_number:     String(row['po_number']  || '').trim() || null,
        note:          String(row['note']       || '').trim() || null,
      };

      try {
        await prisma.asset.upsert({
          where:  { asset_code: assetCode },
          update: payload,
          create: { asset_code: assetCode, ...payload },
        });
        successCount++;
      } catch (dbErr) {
        let msg = dbErr.message;
        if (dbErr.code === 'P2002') msg = `Duplicate serial_no: ${payload.serial_no}`;
        errors.push({ row: rowNum, message: msg });
      }
    }

    return NextResponse.json({ success: successCount, errors, total: rows.length });
  } catch (e) {
    console.error('Import error:', e);
    return NextResponse.json({ error: 'Import failed: ' + e.message }, { status: 500 });
  }
}
