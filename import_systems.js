const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const filePath = 'C:\\atgv\\helpdesk\\IT Project Plan (2).xlsx';
  const workbook = xlsx.readFile(filePath);
  const sheetName = 'System List';
  const sheet = workbook.Sheets[sheetName];
  
  if (!sheet) {
    console.error('Sheet "System List" not found!');
    return;
  }

  const data = xlsx.utils.sheet_to_json(sheet);
  
  for (const row of data) {
    const system_code = row['System Group'];
    const system_name = row['System Name'];
    const group_name = row['Group'] || null;
    
    if (system_code && system_name) {
      try {
        await prisma.systemGroup.upsert({
          where: { system_code: String(system_code) },
          update: {
            system_name: String(system_name),
            group_name: group_name ? String(group_name) : null,
            system_type: 'software'
          },
          create: {
            system_code: String(system_code),
            system_name: String(system_name),
            group_name: group_name ? String(group_name) : null,
            system_type: 'software'
          }
        });
        console.log(`Upserted: ${system_code} - ${system_name}`);
      } catch (err) {
        console.error(`Failed to upsert ${system_code}:`, err);
      }
    }
  }
  
  console.log('Import finished.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
