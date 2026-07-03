import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import http from 'http';

export const dynamic = 'force-dynamic';

// Simple CSV parser
function parseCSV(csvText) {
  const lines = [];
  let row = [""];
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        row[row.length - 1] += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push('');
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      lines.push(row);
      row = [''];
    } else {
      row[row.length - 1] += char;
    }
  }
  if (row.length > 1 || row[0] !== '') {
    lines.push(row);
  }
  return lines;
}

// RAM parser
function parseRamGb(ramStr) {
  if (!ramStr) return null;
  const match = ramStr.match(/(\d+(?:\.\d+)?)\s*(MB|GB|KB|TB)/i);
  if (!match) return null;
  const val = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  if (unit === 'GB') return Math.round(val);
  if (unit === 'MB') return Math.round(val / 1024);
  if (unit === 'TB') return Math.round(val * 1024);
  return null;
}

// Storage size parser
function parseStorageGb(storageStr) {
  if (!storageStr) return null;
  const match = storageStr.match(/(\d+(?:\.\d+)?)\s*(MB|GB|KB|TB)/i);
  if (!match) return null;
  const val = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  if (unit === 'GB') return Math.round(val);
  if (unit === 'MB') return Math.round(val / 1024);
  if (unit === 'TB') return Math.round(val * 1024);
  return null;
}

// Storage type parser
function parseStorageType(typeStr, sizeStr) {
  const combined = `${typeStr || ''} ${sizeStr || ''}`.toLowerCase();
  if (combined.includes('ssd') || combined.includes('nvme') || combined.includes('flash') || combined.includes('solid state') || combined.includes('wds') || combined.includes('kingston') || combined.includes('crucial')) {
    return 'SSD';
  }
  if (combined.includes('hdd') || combined.includes('sata') || combined.includes('wdc wd') || combined.includes('st1000') || combined.includes('seagate')) {
    return 'HDD';
  }
  return null;
}

// English to Thai Location name keyword mapper
const nameMappings = {
  'lat krabang': 'ลาดกระบัง',
  'bo win': 'บ่อวิน',
  'sathon': 'สาทร',
  'chiang rai': 'เชียงราย',
  'westgate': 'เวสต์เกต',
  'rayong': 'ระยอง',
  'si racha': 'ศรีราชา',
  'mahachai': 'มหาชัย',
  'ban chang': 'บ้านฉาง',
  'chachoengsao': 'ฉะเชิงเทรา',
  'chaiyaphum': 'ชัยภูมิ',
  'suphan buri': 'สุพรรณบุรี',
  'kanchanaburi': 'กาญจนบุรี',
  'ratchaburi': 'ราชบุรี',

  // Thaiwatsadu and Go Wow / Other locations
  'srisaman': 'ศรีสมาน',
  'bangsaen': 'บางแสน',
  'rangsit': 'รังสิต',
  'phuket': 'ภูเก็ต',
  'nakornin': 'นครอินทร์',
  'udonthani': 'อุดรธานี',
  'rama3': 'พระราม 3',
  'bangbuathong': 'บางบัวทอง',
  'buriram': 'บุรีรัมย์',
  'surat thani': 'สุราษฏร์',
  'phetchabun': 'เพชรบูรณ์',
  'suksawat': 'สุขสวัสดิ์',
  'nakhon ratchasima': 'นครราชสีมา',
  'yasothon': 'ยโสธร',
  'arunyaprathet': 'อรัญประเทศ',
  'sa kaeo': 'สระแก้ว',
  'wongnoi': 'วังน้อย',
  'mahathi': 'มหาชัย'
};

// GLPI authentication helper
async function getLoginPage() {
  return new Promise((resolve, reject) => {
    const req = http.get('http://glpi.chg.int/glpi/index.php?noAUTO=1', (res) => {
      let data = '';
      const cookies = res.headers['set-cookie'] || [];
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ data, cookies });
      });
    });
    req.on('error', reject);
  });
}

function parseForm(html) {
  const csrfMatch = html.match(/name="_glpi_csrf_token"\s+value="([^"]+)"/);
  const csrfToken = csrfMatch ? csrfMatch[1] : '';

  const loginNameMatch = html.match(/id="login_name"\s+name="([^"]+)"/);
  const loginNameField = loginNameMatch ? loginNameMatch[1] : '';

  let passwordField = '';
  if (loginNameField) {
    const index = html.indexOf(loginNameField);
    const subHtml = html.substring(index);
    const pwdMatch = subHtml.match(/type="password"[^>]*name="([^"]+)"/);
    if (pwdMatch) passwordField = pwdMatch[1];
  }

  return { csrfToken, loginNameField, passwordField };
}

async function postLogin(cookies, formData) {
  const postData = Object.entries(formData)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'glpi.chg.int',
      port: 80,
      path: '/glpi/front/login.php',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'Cookie': cookies.map(c => c.split(';')[0]).join('; '),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': 'http://glpi.chg.int/glpi/index.php?noAUTO=1'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      const resCookies = res.headers['set-cookie'] || [];
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          cookies: resCookies,
          data
        });
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function fetchPage(cookies, path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'glpi.chg.int',
      port: 80,
      path: path,
      method: 'GET',
      headers: {
        'Cookie': cookies.map(c => c.split(';')[0]).join('; '),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': 'http://glpi.chg.int/glpi/front/central.php'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

export async function POST(request) {
  try {
    // 1. Authenticate with GLPI
    const { data: loginHtml, cookies: initCookies } = await getLoginPage();
    const parsedForm = parseForm(loginHtml);

    if (!parsedForm.csrfToken || !parsedForm.loginNameField || !parsedForm.passwordField) {
      return NextResponse.json({ error: 'Failed to parse GLPI login form fields' }, { status: 500 });
    }

    const formData = {
      'noAUTO': '1',
      'redirect': '',
      '_glpi_csrf_token': parsedForm.csrfToken,
      [parsedForm.loginNameField]: 'choisara',
      [parsedForm.passwordField]: '123456789',
      'auth': 'local',
      'submit': 'Sign in'
    };

    const loginRes = await postLogin(initCookies, formData);
    if (loginRes.statusCode !== 302) {
      return NextResponse.json({ error: 'GLPI Login failed. Please check credentials.' }, { status: 401 });
    }

    const loggedInCookies = loginRes.cookies.length > 0 ? loginRes.cookies : initCookies;

    // Load active DB Business Units and Locations for mapping
    const [dbLocations, dbBUs, dbAssetTypes] = await Promise.all([
      prisma.location.findMany(),
      prisma.businessUnit.findMany({ where: { is_active: true } }),
      prisma.assetType.findMany()
    ]);

    // Default BU is 'Auto1' (code 'TW' or whichever matches bu_id 33 or starts with Auto1)
    const auto1BU = dbBUs.find(b => b.bu_id === 33 || b.bu_code.toUpperCase() === 'TW' || b.bu_name.toLowerCase().includes('auto')) || dbBUs[0];
    if (!auto1BU) {
      return NextResponse.json({ error: 'No active Business Unit found in the database.' }, { status: 500 });
    }

    // Asset Types to fetch from GLPI
    const assetCategories = [
      { name: 'Computer', defaultIcon: 'fa-desktop' },
      { name: 'Monitor', defaultIcon: 'fa-tv' },
      { name: 'Printer', defaultIcon: 'fa-print' },
      { name: 'NetworkEquipment', defaultIcon: 'fa-network-wired' },
      { name: 'Peripheral', defaultIcon: 'fa-keyboard' },
      { name: 'Phone', defaultIcon: 'fa-phone' }
    ];

    let successCount = 0;
    const errors = [];
    let totalRecords = 0;

    // Cache of dynamically retrieved asset types
    const assetTypeCache = new Map(dbAssetTypes.map(t => [t.type_name.toLowerCase(), t]));

    // Keep track of serial numbers we process in this execution to prevent self-collision
    const seenSerialsThisRun = new Set();

    for (const cat of assetCategories) {
      const csvPath = `/glpi/front/report.dynamic.php?item_type=${cat.name}&start=0&criteria%5B0%5D%5Bfield%5D=view&criteria%5B0%5D%5Blink%5D=contains&criteria%5B0%5D%5Bvalue%5D=&display_type=3`;
      const reportRes = await fetchPage(loggedInCookies, csvPath);

      if (reportRes.statusCode !== 200) {
        errors.push({ category: cat.name, message: `Failed to fetch CSV. Status: ${reportRes.statusCode}` });
        continue;
      }

      const rows = parseCSV(reportRes.data);
      if (rows.length <= 1) continue; // Only header or empty

      const rawHeaders = rows[0].map(h => h.trim().replace(/^\ufeff/, '')); // strip BOM
      const headersMap = {};
      rawHeaders.forEach((h, idx) => {
        const lowerH = h.toLowerCase();
        if (lowerH === 'name' || lowerH === 'computer name' || lowerH === 'monitor name' || lowerH === 'printer name' || lowerH === 'peripheral name' || lowerH === 'phone name') headersMap.name = idx;
        if (lowerH === 'status') headersMap.status = idx;
        if (lowerH === 'manufacturers' || lowerH === 'manufacturer' || lowerH === 'brand') headersMap.manufacturer = idx;
        if (lowerH === 'model') headersMap.model = idx;
        if (lowerH === 'serial number' || lowerH === 'serial' || lowerH === 'serial_no') headersMap.serial = idx;
        if (lowerH === 'locations' || lowerH === 'location') headersMap.location = idx;
        if (lowerH === 'operating system - name' || lowerH === 'os') headersMap.os = idx;
        if (lowerH === 'networking - ip' || lowerH === 'ip') headersMap.ip = idx;
        if (lowerH === 'networking - mac address' || lowerH === 'mac') headersMap.mac = idx;
        if (lowerH === 'comments' || lowerH === 'comment' || lowerH === 'note') headersMap.comment = idx;
        if (lowerH === 'types' || lowerH === 'type') headersMap.type = idx;
      });

      // Find indexes for CPU, RAM, Storage in headers
      let cpuIdx = -1;
      let ramIdx = -1;
      let storageSizeIdx = -1;
      let storageTypeIdx = -1;
      rawHeaders.forEach((h, idx) => {
        const lowerH = h.toLowerCase();
        if (lowerH.includes('processor') && lowerH.includes('component')) cpuIdx = idx;
        if (lowerH.includes('memory') && lowerH.includes('component')) ramIdx = idx;
        if (lowerH.includes('drive size') && lowerH.includes('component')) storageSizeIdx = idx;
        if (lowerH.includes('drive type') && lowerH.includes('component')) storageTypeIdx = idx;
      });

      // If key headers are missing, map defaults
      if (headersMap.name === undefined) headersMap.name = 0;
      if (headersMap.serial === undefined) headersMap.serial = 5;

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 2) continue; // empty line
        totalRecords++;

        const nameVal = String(row[headersMap.name] || '').trim();
        const serialVal = String(row[headersMap.serial] || '').trim();

        // Use name as asset_code, fallback to serial
        let assetCode = nameVal || serialVal;
        if (!assetCode) {
          errors.push({ category: cat.name, row: i + 1, message: 'Both Name and Serial are missing' });
          continue;
        }

        // Truncate asset_code to 50 chars to match VarChar(50)
        assetCode = assetCode.substring(0, 50);

        // Determine GLPI type name
        let typeName = cat.name;
        if (headersMap.type !== undefined && row[headersMap.type]) {
          typeName = String(row[headersMap.type]).trim();
        }

        // Get or Create AssetType
        let assetType = assetTypeCache.get(typeName.toLowerCase());
        if (!assetType) {
          const typeCode = typeName.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 30) || 'GENERIC';
          assetType = await prisma.assetType.upsert({
            where: { type_code: typeCode },
            update: { type_name: typeName, icon: cat.defaultIcon },
            create: { type_code: typeCode, type_name: typeName, icon: cat.defaultIcon }
          });
          assetTypeCache.set(typeName.toLowerCase(), assetType);
        }

        // Parse Specs: concatenate CPU, Memory, Drive size if available
        let specStr = '';
        const specDetails = [];
        rawHeaders.forEach((h, idx) => {
          if (h.toLowerCase().includes('component') || h.toLowerCase().includes('antiviruses')) {
            if (row[idx] && String(row[idx]).trim()) {
              specDetails.push(`${h.replace('Components - ', '')}: ${String(row[idx]).trim().replace(/<br>/g, ', ')}`);
            }
          }
        });
        if (specDetails.length > 0) {
          specStr = specDetails.join('\n');
        }

        // Parse exact CPU, RAM, and Storage
        let cpuVal = null;
        let ramGbVal = null;
        let storageGbVal = null;
        let storageTypeVal = null;

        if (cpuIdx !== -1 && row[cpuIdx]) {
          cpuVal = String(row[cpuIdx]).trim().replace(/<br>/g, ', ').substring(0, 100);
        }
        if (ramIdx !== -1 && row[ramIdx]) {
          ramGbVal = parseRamGb(String(row[ramIdx]));
        }
        if (storageSizeIdx !== -1 && row[storageSizeIdx]) {
          storageGbVal = parseStorageGb(String(row[storageSizeIdx]));
        }
        if (storageTypeIdx !== -1 || storageSizeIdx !== -1) {
          const typeStr = storageTypeIdx !== -1 ? String(row[storageTypeIdx]) : '';
          const sizeStr = storageSizeIdx !== -1 ? String(row[storageSizeIdx]) : '';
          storageTypeVal = parseStorageType(typeStr, sizeStr);
        }

        // Map IP and MAC
        let ipVal = null;
        if (headersMap.ip !== undefined && row[headersMap.ip]) {
          const ips = String(row[headersMap.ip]).split(/<br>/i);
          const validIp = ips.find(ip => ip.includes('.') && !ip.startsWith('127.'));
          ipVal = validIp ? validIp.trim() : ips[0].trim();
          ipVal = ipVal.substring(0, 50);
        }

        let macVal = null;
        if (headersMap.mac !== undefined && row[headersMap.mac]) {
          const macs = String(row[headersMap.mac]).split(/<br>/i);
          const validMac = macs.find(mac => mac.trim() && mac.trim() !== '00:00:00:00:00:00');
          macVal = validMac ? validMac.trim() : macs[0].trim();
          macVal = macVal.substring(0, 50);
        }

        // Smart Location and BU mapping
        let locationId = null;
        let buId = auto1BU.bu_id;

        if (headersMap.location !== undefined && row[headersMap.location]) {
          const glpiLoc = String(row[headersMap.location]).trim();
          const glpiLocLower = glpiLoc.toLowerCase();

          let matchedLoc = null;
          if (glpiLocLower.includes('head office')) {
            matchedLoc = dbLocations.find(l => l.location_code === 'HEADOFFICE');
          } else {
            let thaiKeyword = '';
            for (const [eng, thai] of Object.entries(nameMappings)) {
              if (glpiLocLower.includes(eng)) {
                thaiKeyword = thai;
                break;
              }
            }

            if (thaiKeyword) {
              const candidates = dbLocations.filter(l => l.location_name.includes(thaiKeyword));

              if (candidates.length > 0) {
                // If we have candidates, filter by brand to ensure correct mapping
                let brandCandidates = [];
                if (glpiLocLower.includes('auto1')) {
                  brandCandidates = candidates.filter(c => c.location_code.startsWith('10') || c.location_name.toLowerCase().includes('auto'));
                } else if (glpiLocLower.includes('go wow')) {
                  brandCandidates = candidates.filter(c => c.location_name.toLowerCase().includes('go wow'));
                } else if (glpiLocLower.includes('thaiwatsadu') || glpiLocLower.includes('bnb')) {
                  brandCandidates = candidates.filter(c => c.location_name.toLowerCase().includes('ไทวัสดุ') || c.location_name.toLowerCase().includes('bnb') || c.location_code.startsWith('02') || c.location_code.startsWith('03'));
                }

                const filtered = brandCandidates.length > 0 ? brandCandidates : candidates;

                let best = null;
                if (glpiLocLower.includes('central')) {
                  best = filtered.find(c => c.location_name.includes('เซ็นทรัล'));
                } else if (glpiLocLower.includes('robinson')) {
                  best = filtered.find(c => c.location_name.includes('โรบินสัน'));
                } else if (glpiLocLower.includes('lotus')) {
                  best = filtered.find(c => c.location_name.includes('โลตัส'));
                }
                matchedLoc = best || filtered[0];
              }
            }
          }

          if (matchedLoc) {
            locationId = matchedLoc.location_id;
            if (matchedLoc.bu_id) {
              buId = matchedLoc.bu_id;
            }
          }
        }

        // Parse status
        const glpiStatus = String(row[headersMap.status] || '').toLowerCase().trim();
        let status = 'IN_USE';
        if (glpiStatus === 'spare' || glpiStatus.includes('สำรอง')) status = 'SPARE';
        else if (glpiStatus === 'repair' || glpiStatus.includes('ซ่อม')) status = 'REPAIR';
        else if (glpiStatus === 'retired' || glpiStatus.includes('เลิก')) status = 'RETIRED';
        else if (glpiStatus === 'lost' || glpiStatus.includes('หาย')) status = 'LOST';

        // Normalize and de-duplicate serial_no
        let serialNo = serialVal ? serialVal.substring(0, 100) : null;
        if (serialNo) {
          const lowerSerial = serialNo.toLowerCase().trim();
          const genericPlaceholders = [
            'to be filled by o.e.m.',
            'system serial number',
            'default string',
            '123456789',
            'n/a',
            'none',
            'null',
            'unknown',
            'empty',
            '-'
          ];
          if (genericPlaceholders.includes(lowerSerial)) {
            serialNo = null;
          }
        }

        if (serialNo) {
          // Check if we've seen this serial number in this run, or if it exists in the DB under a different asset
          const isSeenThisRun = seenSerialsThisRun.has(serialNo);
          let existsInDb = false;
          if (!isSeenThisRun) {
            const duplicateInDb = await prisma.asset.findFirst({
              where: {
                serial_no: serialNo,
                asset_code: { not: assetCode }
              }
            });
            if (duplicateInDb) {
              existsInDb = true;
            }
          }

          if (isSeenThisRun || existsInDb) {
            // Append a unique suffix using the assetCode to resolve the unique constraint
            serialNo = `${serialNo}-DUP-${assetCode}`.substring(0, 100);
          }
          
          seenSerialsThisRun.add(serialNo);
        }

        const payload = {
          asset_type_id: assetType.type_id,
          brand: headersMap.manufacturer !== undefined ? (String(row[headersMap.manufacturer] || '').trim() || null) : null,
          model: headersMap.model !== undefined ? (String(row[headersMap.model] || '').trim() || null) : null,
          serial_no: serialNo,
          spec: specStr || null,
          os: headersMap.os !== undefined ? (String(row[headersMap.os] || '').trim() || null) : null,
          mac_address: macVal,
          ip_address: ipVal,
          location_id: locationId,
          bu_id: buId,
          status,
          note: headersMap.comment !== undefined ? (String(row[headersMap.comment] || '').trim() || null) : null,
          cpu: cpuVal,
          ram_gb: ramGbVal,
          storage_gb: storageGbVal,
          storage_type: storageTypeVal
        };

        // Truncate fields to prevent DB errors
        if (payload.brand) payload.brand = payload.brand.substring(0, 100);
        if (payload.model) payload.model = payload.model.substring(0, 100);
        if (payload.os) payload.os = payload.os.substring(0, 100);

        try {
          await prisma.asset.upsert({
            where: { asset_code: assetCode },
            update: payload,
            create: { asset_code: assetCode, ...payload }
          });
          successCount++;
        } catch (dbErr) {
          let msg = dbErr.message;
          if (dbErr.code === 'P2002') msg = `Duplicate serial_no: ${payload.serial_no}`;
          errors.push({ category: cat.name, row: i + 1, assetCode, message: msg });
        }
      }
    }

    return NextResponse.json({ success: successCount, errors, total: totalRecords });
  } catch (e) {
    console.error('GLPI sync error:', e);
    return NextResponse.json({ error: 'GLPI sync failed: ' + e.message }, { status: 500 });
  }
}
