const { Client } = require('pg');
const bcrypt = require('bcrypt');

const databaseUrl = process.env.DATABASE_URL;
const adminPassword = process.env.ADMIN_PASSWORD;
if (!databaseUrl || !adminPassword) {
  console.error('DATABASE_URL and ADMIN_PASSWORD are required');
  process.exit(1);
}

const c = new Client({ connectionString: databaseUrl });

async function main() {
  await c.connect();

  const hash = await bcrypt.hash(adminPassword, 10);
  console.log('Generated hash:', hash.substring(0, 20) + '...');

  await c.query('UPDATE admin_users SET password = $1', [hash]);
  console.log('Passwords updated to bcrypt');

  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
