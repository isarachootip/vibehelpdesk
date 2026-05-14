const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const filePath = 'C:\\\\atgv\\\\helpdesk\\\\IT Project Plan (2).xlsx';
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets['System List'];
  if (!sheet) return;
  const data = xlsx.utils.sheet_to_json(sheet);
  
  for (const row of data) {
    // 1. Process IT Users (Tier 2)
    let owner_id = null;
    if (row['IT']) {
      const itName = row['IT'].split(',')[0].trim();
      const email = itName.toLowerCase() + '@company.com';
      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: { email, full_name: itName, role: 'tier2' }
      });
      owner_id = user.user_id;
    }

    // 2. Process Key Users (End Users)
    if (row['User']) {
      const keyUsers = row['User'].split(',').map(u => u.trim());
      for (const uName of keyUsers) {
        if (!uName) continue;
        const email = uName.toLowerCase() + '@company.com';
        await prisma.user.upsert({
          where: { email },
          update: {},
          create: { email, full_name: uName, role: 'end_user' }
        });
      }
    }

    // 3. Upsert System
    const system_code = row['System Group'];
    const system_name = row['System Name'];
    const group_name = row['Group'] || null;
    
    if (system_code && system_name) {
      await prisma.systemGroup.upsert({
        where: { system_code: String(system_code) },
        update: {
          system_name: String(system_name),
          group_name: group_name ? String(group_name) : null,
          owner_user_id: owner_id,
          system_type: 'software'
        },
        create: {
          system_code: String(system_code),
          system_name: String(system_name),
          group_name: group_name ? String(group_name) : null,
          owner_user_id: owner_id,
          system_type: 'software'
        }
      });
    }
  }
  console.log('Import finished.');
}
main().catch(console.error).finally(() => prisma.$disconnect());
