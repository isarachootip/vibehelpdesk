const { PrismaClient } = require('@prisma/client');

async function checkDb(dbName) {
  const url = `postgresql://postgres:EsQShpeaGvSr21I5ieQGJRmCELp78GSlQn6hQHAIjbTnY4c1aWw56JleGierEk2t@187.77.147.16:5432/${dbName}?sslmode=prefer`;
  console.log(`Checking database: ${dbName}...`);
  const prisma = new PrismaClient({
    datasources: {
      db: { url }
    }
  });

  try {
    const tables = await prisma.$queryRawUnsafe(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);
    const tableNames = tables.map(t => t.table_name);
    console.log(`  Tables in ${dbName}:`, tableNames);

    if (tableNames.some(t => t.toLowerCase() === 'location')) {
      console.log(`  FOUND 'Location' table in ${dbName}!`);
      const count = await prisma.$queryRawUnsafe(`SELECT count(*) FROM "Location";`);
      console.log(`    Location rows:`, count);
    }
    if (tableNames.some(t => t.toLowerCase() === 'asset')) {
      console.log(`  FOUND 'Asset' table in ${dbName}!`);
      const count = await prisma.$queryRawUnsafe(`SELECT count(*) FROM "Asset";`);
      console.log(`    Asset rows:`, count);
    }
  } catch (e) {
    console.error(`  Error checking ${dbName}:`, e.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function run() {
  await checkDb('contentdb');
  await checkDb('timesheet_db');
  await checkDb('stk_sales');
}

run();
