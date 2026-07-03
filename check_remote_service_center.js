const { PrismaClient } = require('@prisma/client');

async function run() {
  const url = "postgresql://postgres:EsQShpeaGvSr21I5ieQGJRmCELp78GSlQn6hQHAIjbTnY4c1aWw56JleGierEk2t@187.77.147.16:5432/service_center?sslmode=prefer";
  console.log("Connecting to remote service_center database...");
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
    console.log("Tables in remote service_center DB:", tables.map(t => t.table_name));

    // If Asset table exists, count rows
    if (tables.some(t => t.table_name.toLowerCase() === 'asset')) {
      const assetCount = await prisma.$queryRawUnsafe(`SELECT count(*) FROM "Asset";`);
      console.log("Asset rows count:", assetCount);

      const activeAssetCount = await prisma.$queryRawUnsafe(`SELECT count(*) FROM "Asset" WHERE is_active = true;`);
      console.log("Active Asset rows count:", activeAssetCount);

      const sampleAssets = await prisma.$queryRawUnsafe(`SELECT asset_id, asset_code, bu_id FROM "Asset" LIMIT 5;`);
      console.log("Sample assets:", sampleAssets);
    }
  } catch (e) {
    console.error("Error connecting to remote service_center:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

run();
