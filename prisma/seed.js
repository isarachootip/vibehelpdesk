const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Helpdesk Database...\n');

  // ===========================
  // 1. Business Units
  // ===========================
  const buData = [
    { bu_code: 'TWD', bu_name: 'Thaiwatsadu' },
    { bu_code: 'BNB', bu_name: 'BNB Home' },
    { bu_code: 'Auto1', bu_name: 'Auto1' },
    { bu_code: 'Vfix', bu_name: 'vFIX' },
    { bu_code: 'Joy', bu_name: 'JoyCafe' },
    { bu_code: 'TOPS', bu_name: 'TOPS' },
    { bu_code: 'SSP', bu_name: 'SSP' },
    { bu_code: 'CFW', bu_name: 'Central Food Wholesale' },
    { bu_code: 'PWB', bu_name: 'Power Buy' },
    { bu_code: 'CDS', bu_name: 'CDS' },
    { bu_code: 'CFR', bu_name: 'CFR' },
    { bu_code: 'RBS', bu_name: 'RBS' },
    { bu_code: 'Beautrium', bu_name: 'Beautrium' },
  ];

  for (const bu of buData) {
    await prisma.businessUnit.upsert({
      where: { bu_code: bu.bu_code },
      update: { bu_name: bu.bu_name },
      create: bu,
    });
  }
  console.log(`✅ ${buData.length} Business Units seeded`);

  // ===========================
  // 2. Locations
  // ===========================
  const locationData = [
    { location_code: 'HQ-F1', location_name: 'Head Quarter ชั้น 1', location_type: 'hq', floor: '1' },
    { location_code: 'HQ-F2', location_name: 'Head Quarter ชั้น 2', location_type: 'hq', floor: '2' },
    { location_code: 'HQ-F3', location_name: 'Head Quarter ชั้น 3', location_type: 'hq', floor: '3' },
    { location_code: 'HQ-B1', location_name: 'Head Quarter ชั้นใต้ดิน', location_type: 'hq', floor: 'B1' },
    { location_code: 'STR-001', location_name: 'สาขา 001', location_type: 'store' },
    { location_code: 'STR-002', location_name: 'สาขา 002', location_type: 'store' },
    { location_code: 'STR-003', location_name: 'สาขา 003', location_type: 'store' },
    { location_code: 'WH-001', location_name: 'คลังสินค้า 001', location_type: 'warehouse' },
    { location_code: 'DC-001', location_name: 'ศูนย์กระจายสินค้า 001', location_type: 'dc' },
  ];

  for (const loc of locationData) {
    await prisma.location.upsert({
      where: { location_code: loc.location_code },
      update: { location_name: loc.location_name },
      create: loc,
    });
  }
  console.log(`✅ ${locationData.length} Locations seeded`);

  // ===========================
  // 3. Users (IT Team + Sample End Users)
  // ===========================
  const userData = [
    // Admin
    { email: 'admin@company.com', full_name: 'System Admin', role: 'admin' },
    // Tier 1 — Master Support
    { email: 'tier1.support1@company.com', full_name: 'Support Team 1', role: 'tier1' },
    { email: 'tier1.support2@company.com', full_name: 'Support Team 2', role: 'tier1' },
    // Tier 2 — System Owners (from IT Project Plan)
    { email: 'suchachuan@company.com', full_name: 'Suchachuan', role: 'tier2' },
    { email: 'wiraporn@company.com', full_name: 'Wiraporn', role: 'tier2' },
    { email: 'kittikoon@company.com', full_name: 'Kittikoon', role: 'tier2' },
    { email: 'kanathis@company.com', full_name: 'Kanathis', role: 'tier2' },
    { email: 'warut@company.com', full_name: 'Warut', role: 'tier2' },
    { email: 'pakorn@company.com', full_name: 'Pakorn', role: 'tier2' },
    { email: 'surattaphong@company.com', full_name: 'Surattaphong', role: 'tier2' },
    { email: 'suphichaporn@company.com', full_name: 'Suphichaporn', role: 'tier2' },
    { email: 'isara@company.com', full_name: 'Isara', role: 'tier2' },
    { email: 'sudkong@company.com', full_name: 'Sudkong', role: 'tier2' },
    { email: 'sakda@company.com', full_name: 'Sakda', role: 'tier2' },
    { email: 'jiraphong@company.com', full_name: 'Jiraphong', role: 'tier2' },
    { email: 'sirikan@company.com', full_name: 'Sirikan', role: 'tier2' },
    { email: 'thunyarat@company.com', full_name: 'Thunyarat', role: 'tier2' },
    { email: 'chanita@company.com', full_name: 'Chanita', role: 'tier2' },
    // Sample End Users (Key Users from IT Plan)
    { email: 'warunee@company.com', full_name: 'Warunee', role: 'end_user' },
    { email: 'ratthawit@company.com', full_name: 'Ratthawit', role: 'end_user' },
    { email: 'tawatchai@company.com', full_name: 'Tawatchai', role: 'end_user' },
    { email: 'saowapa@company.com', full_name: 'Saowapa', role: 'end_user' },
    { email: 'mananya@company.com', full_name: 'Mananya', role: 'end_user' },
    { email: 'thanita@company.com', full_name: 'Thanita', role: 'end_user' },
    { email: 'damrong@company.com', full_name: 'Damrong', role: 'end_user' },
    { email: 'torrung@company.com', full_name: 'Torrung', role: 'end_user' },
    { email: 'vinai@company.com', full_name: 'Vinai', role: 'end_user' },
    { email: 'siriluk@company.com', full_name: 'Siriluk', role: 'end_user' },
    { email: 'wesiya@company.com', full_name: 'Wesiya', role: 'end_user' },
    { email: 'sutarat@company.com', full_name: 'Sutarat', role: 'end_user' },
  ];

  const userMap = {};
  for (const u of userData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { full_name: u.full_name, role: u.role },
      create: u,
    });
    userMap[u.email] = user.user_id;
  }
  console.log(`✅ ${userData.length} Users seeded`);

  // ===========================
  // 4. System Groups (from IT Project Plan)
  // ===========================
  const systemData = [
    { system_code: 'ONL', system_name: 'Web/App / The1', system_type: 'software', group_name: 'WEB / App', owner_email: 'suchachuan@company.com' },
    { system_code: 'EOR', system_name: 'E-ordering', system_type: 'software', group_name: 'WEB / App', owner_email: 'suchachuan@company.com' },
    { system_code: 'MMS', system_name: 'MMS', system_type: 'software', group_name: 'Data / Report', owner_email: 'wiraporn@company.com' },
    { system_code: 'CCT', system_name: 'CCT', system_type: 'software', group_name: null, owner_email: 'kittikoon@company.com' },
    { system_code: 'PSN', system_name: 'Pricesign', system_type: 'software', group_name: null, owner_email: 'kanathis@company.com' },
    { system_code: 'PLPP', system_name: 'PLPP', system_type: 'software', group_name: null, owner_email: 'chanita@company.com' },
    { system_code: 'POS', system_name: 'POS', system_type: 'software', group_name: null, owner_email: 'warut@company.com' },
    { system_code: 'STS', system_name: 'STS', system_type: 'software', group_name: null, owner_email: 'pakorn@company.com' },
    { system_code: 'SLC', system_name: 'Seller Center', system_type: 'software', group_name: 'WEB / App', owner_email: 'surattaphong@company.com' },
    { system_code: 'BIS', system_name: 'BIS', system_type: 'software', group_name: null, owner_email: 'surattaphong@company.com' },
    { system_code: 'PIM', system_name: 'PIM', system_type: 'software', group_name: null, owner_email: 'surattaphong@company.com' },
    { system_code: 'CMS', system_name: 'CMS', system_type: 'software', group_name: null, owner_email: 'surattaphong@company.com' },
    { system_code: 'PBI', system_name: 'Power BI', system_type: 'software', group_name: 'Data / Report', owner_email: 'suphichaporn@company.com' },
    { system_code: 'WMS', system_name: 'WMS', system_type: 'software', group_name: 'WEB / App', owner_email: 'pakorn@company.com' },
    { system_code: 'MKP', system_name: 'Marketplace/Quick Commerce', system_type: 'software', group_name: null, owner_email: 'surattaphong@company.com' },
    { system_code: 'STK', system_name: 'Sale Tracking', system_type: 'software', group_name: 'WEB / App', owner_email: 'isara@company.com' },
    { system_code: 'KNN', system_name: 'Kanna', system_type: 'software', group_name: null, owner_email: 'sudkong@company.com' },
    { system_code: 'WAP', system_name: 'Web Approve / Workflow', system_type: 'software', group_name: 'WEB / App', owner_email: 'sakda@company.com' },
    { system_code: '3CX', system_name: '3CX', system_type: 'hardware', group_name: null, owner_email: 'jiraphong@company.com' },
    { system_code: 'WMA', system_name: 'Web MA', system_type: 'software', group_name: 'WEB / App', owner_email: 'sakda@company.com' },
    { system_code: 'WHS', system_name: 'Wholesale', system_type: 'software', group_name: 'Wholesale', owner_email: 'sirikan@company.com' },
    { system_code: 'STC', system_name: 'Stock Location', system_type: 'software', group_name: null, owner_email: 'kittikoon@company.com' },
    { system_code: 'A1TL', system_name: 'Auto1 Tablet', system_type: 'hardware', group_name: null, owner_email: 'sirikan@company.com' },
    { system_code: 'LINE', system_name: 'Line OA / Notification', system_type: 'software', group_name: 'AI / Chat / Line', owner_email: 'isara@company.com' },
    { system_code: 'WDS', system_name: 'Web Direct Sale', system_type: 'software', group_name: 'WEB / App', owner_email: 'pakorn@company.com' },
    { system_code: 'RPS', system_name: 'Repairing Service', system_type: 'software', group_name: null, owner_email: 'isara@company.com' },
    { system_code: 'WCT', system_name: 'Web Control', system_type: 'software', group_name: 'WEB / App', owner_email: 'suchachuan@company.com' },
    { system_code: 'OIC', system_name: 'Other Income', system_type: 'software', group_name: null, owner_email: 'thunyarat@company.com' },
    { system_code: 'RPL', system_name: 'Replenishment', system_type: 'software', group_name: null, owner_email: 'thunyarat@company.com' },
    { system_code: 'CNS', system_name: 'ChatNShop', system_type: 'software', group_name: 'AI / Chat / Line', owner_email: 'isara@company.com' },
    { system_code: 'ASM', system_name: 'Asset Management', system_type: 'software', group_name: null, owner_email: 'isara@company.com' },
    { system_code: 'AIM', system_name: 'AI Management', system_type: 'software', group_name: 'AI / Chat / Line', owner_email: 'isara@company.com' },
    { system_code: 'SLT', system_name: 'Slot Booking', system_type: 'software', group_name: null, owner_email: 'surattaphong@company.com' },
  ];

  for (const sys of systemData) {
    const ownerId = userMap[sys.owner_email] || null;
    await prisma.systemGroup.upsert({
      where: { system_code: sys.system_code },
      update: {
        system_name: sys.system_name,
        system_type: sys.system_type,
        group_name: sys.group_name,
        owner_user_id: ownerId,
      },
      create: {
        system_code: sys.system_code,
        system_name: sys.system_name,
        system_type: sys.system_type,
        group_name: sys.group_name,
        owner_user_id: ownerId,
      },
    });
  }
  console.log(`✅ ${systemData.length} System Groups seeded`);

  // ===========================
  // 5. Sample Tickets (Demo Data)
  // ===========================
  const twdBu = await prisma.businessUnit.findUnique({ where: { bu_code: 'TWD' } });
  const bnbBu = await prisma.businessUnit.findUnique({ where: { bu_code: 'BNB' } });
  const auto1Bu = await prisma.businessUnit.findUnique({ where: { bu_code: 'Auto1' } });
  const hqLoc = await prisma.location.findUnique({ where: { location_code: 'HQ-F2' } });
  const storeLoc = await prisma.location.findUnique({ where: { location_code: 'STR-001' } });
  const posSys = await prisma.systemGroup.findUnique({ where: { system_code: 'POS' } });
  const onlSys = await prisma.systemGroup.findUnique({ where: { system_code: 'ONL' } });
  const wmsSys = await prisma.systemGroup.findUnique({ where: { system_code: 'WMS' } });

  const reporter1 = userMap['warunee@company.com'];
  const reporter2 = userMap['tawatchai@company.com'];
  const reporter3 = userMap['mananya@company.com'];
  const tier1User = userMap['tier1.support1@company.com'];

  const sampleTickets = [
    {
      ticket_no: 'TWD0505202600001',
      subject: 'POS ไม่สามารถเปิดหน้าขายได้',
      problem_type: 'software',
      system_id: posSys.system_id,
      location_id: storeLoc.location_id,
      reporter_id: reporter1,
      reporter_email: 'warunee@company.com',
      bu_id: twdBu.bu_id,
      tier1_id: tier1User,
      status: 'IN_PROGRESS',
      priority: 'High',
      description: 'เปิดระบบ POS แล้วขึ้น Error ไม่สามารถเข้าหน้าขายสินค้าได้ ทำให้ไม่สามารถขายสินค้าให้ลูกค้าได้',
      symptom: 'หน้าจอขึ้น Error 500 - Internal Server Error เมื่อกดเข้าหน้าขายสินค้า',
      tier1_accepted_at: new Date('2026-05-05T08:05:00Z'),
      initial_assessment: 'ตรวจสอบเบื้องต้นพบว่า POS server มีปัญหาการเชื่อมต่อ Database',
    },
    {
      ticket_no: 'BNB0505202600001',
      subject: 'เว็บไซต์ BNB Home โหลดช้ามาก',
      problem_type: 'software',
      system_id: onlSys.system_id,
      location_id: hqLoc.location_id,
      reporter_id: reporter2,
      reporter_email: 'tawatchai@company.com',
      bu_id: bnbBu.bu_id,
      tier1_id: tier1User,
      tier2_id: userMap['suchachuan@company.com'],
      status: 'ESCALATED',
      priority: 'Medium',
      description: 'เว็บไซต์ BNB Home ใช้เวลาโหลดนานกว่า 30 วินาที ลูกค้าร้องเรียนเข้ามาเยอะ',
      symptom: 'เว็บไซต์โหลดช้า ใช้เวลามากกว่า 30 วินาที ทุกหน้า',
      tier1_accepted_at: new Date('2026-05-05T07:30:00Z'),
      tier1_assessed_at: new Date('2026-05-05T07:45:00Z'),
      is_escalated: true,
      escalated_at: new Date('2026-05-05T07:46:00Z'),
      escalate_reason: 'ปัญหาเกี่ยวกับ Server Performance ต้องให้ทีม Dev ตรวจสอบ',
    },
    {
      ticket_no: 'Auto10505202600001',
      subject: 'Printer สาขา 001 ไม่ทำงาน',
      problem_type: 'hardware',
      system_id: posSys.system_id,
      location_id: storeLoc.location_id,
      reporter_id: reporter3,
      reporter_email: 'mananya@company.com',
      bu_id: auto1Bu.bu_id,
      tier1_id: tier1User,
      tier2_id: userMap['warut@company.com'],
      status: 'RESOLVED',
      priority: 'Low',
      description: 'Printer ที่ใช้พิมพ์ใบเสร็จไม่ทำงาน ไม่ดึงกระดาษ',
      symptom: 'Printer ไม่ดึงกระดาษ มีเสียงดัง แต่กระดาษไม่ออก',
      tier1_accepted_at: new Date('2026-05-04T09:00:00Z'),
      tier1_assessed_at: new Date('2026-05-04T09:15:00Z'),
      is_escalated: true,
      escalated_at: new Date('2026-05-04T09:16:00Z'),
      tier2_accepted_at: new Date('2026-05-04T09:30:00Z'),
      repair_started_at: new Date('2026-05-04T10:00:00Z'),
      resolved_at: new Date('2026-05-04T11:30:00Z'),
      root_cause: 'ลูกยาง Feed กระดาษสึกหรอ',
      root_cause_category: 'Hardware Failure',
      resolution: 'เปลี่ยนลูกยาง Feed กระดาษใหม่',
      resolution_detail: 'เปลี่ยนลูกยาง Feed รุ่น PR-220 เรียบร้อย ทดสอบพิมพ์ 10 ใบ ปกติ',
    },
    {
      ticket_no: 'TWD0405202600001',
      subject: 'ระบบ WMS scan barcode ไม่ได้',
      problem_type: 'software',
      system_id: wmsSys.system_id,
      location_id: hqLoc.location_id,
      reporter_id: reporter1,
      reporter_email: 'warunee@company.com',
      bu_id: twdBu.bu_id,
      tier1_id: tier1User,
      tier2_id: userMap['pakorn@company.com'],
      status: 'CLOSED',
      priority: 'High',
      description: 'ระบบ WMS ไม่สามารถ scan barcode สินค้าได้ ทำให้คลังสินค้าทำงานไม่ได้',
      symptom: 'เมื่อ scan barcode ระบบขึ้น "Invalid barcode format"',
      tier1_accepted_at: new Date('2026-05-04T08:10:00Z'),
      tier1_assessed_at: new Date('2026-05-04T08:25:00Z'),
      is_escalated: true,
      escalated_at: new Date('2026-05-04T08:26:00Z'),
      tier2_accepted_at: new Date('2026-05-04T08:35:00Z'),
      repair_started_at: new Date('2026-05-04T09:00:00Z'),
      resolved_at: new Date('2026-05-04T10:30:00Z'),
      user_confirmed_at: new Date('2026-05-04T10:45:00Z'),
      closed_at: new Date('2026-05-04T10:45:00Z'),
      root_cause: 'Config barcode format ถูกเปลี่ยนหลัง update ล่าสุด',
      root_cause_category: 'Configuration Error',
      resolution: 'แก้ไข Config barcode format กลับเป็นค่าเดิม',
      user_satisfaction: 5,
      user_comment: 'แก้ไขรวดเร็วมาก ขอบคุณครับ',
    },
    {
      ticket_no: 'TWD0505202600002',
      subject: 'Login ระบบ Sale Tracking ไม่ได้',
      problem_type: 'software',
      system_id: (await prisma.systemGroup.findUnique({ where: { system_code: 'STK' } })).system_id,
      location_id: hqLoc.location_id,
      reporter_id: reporter2,
      reporter_email: 'tawatchai@company.com',
      bu_id: twdBu.bu_id,
      status: 'NEW',
      priority: 'Critical',
      description: 'ไม่สามารถ Login เข้าระบบ Sale Tracking ได้ ขึ้น "Authentication Failed"',
      symptom: 'กรอก Username/Password ถูกต้อง แต่ขึ้น "Authentication Failed" ทุกครั้ง',
    },
  ];

  // Upsert job counters
  await prisma.jobCounter.upsert({
    where: { bu_code_date_key: { bu_code: 'TWD', date_key: '05052026' } },
    update: { last_number: 2 },
    create: { bu_code: 'TWD', bu_id: twdBu.bu_id, date_key: '05052026', last_number: 2 },
  });
  await prisma.jobCounter.upsert({
    where: { bu_code_date_key: { bu_code: 'BNB', date_key: '05052026' } },
    update: { last_number: 1 },
    create: { bu_code: 'BNB', bu_id: bnbBu.bu_id, date_key: '05052026', last_number: 1 },
  });
  await prisma.jobCounter.upsert({
    where: { bu_code_date_key: { bu_code: 'Auto1', date_key: '05052026' } },
    update: { last_number: 1 },
    create: { bu_code: 'Auto1', bu_id: auto1Bu.bu_id, date_key: '05052026', last_number: 1 },
  });
  await prisma.jobCounter.upsert({
    where: { bu_code_date_key: { bu_code: 'TWD', date_key: '04052026' } },
    update: { last_number: 1 },
    create: { bu_code: 'TWD', bu_id: twdBu.bu_id, date_key: '04052026', last_number: 1 },
  });

  for (const t of sampleTickets) {
    const existing = await prisma.ticket.findUnique({ where: { ticket_no: t.ticket_no } });
    if (!existing) {
      await prisma.ticket.create({ data: t });
    }
  }
  console.log(`✅ ${sampleTickets.length} Sample Tickets seeded`);

  console.log('\n🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
