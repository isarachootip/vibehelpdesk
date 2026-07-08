const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://postgres:postgres@localhost:5432/postgres"
  });
  await client.connect();
  const res = await client.query("SELECT datname FROM pg_database WHERE datistemplate = false;");
  console.log("Databases on localhost:");
  console.log(res.rows);
  await client.end();
}

main().catch(console.error);
