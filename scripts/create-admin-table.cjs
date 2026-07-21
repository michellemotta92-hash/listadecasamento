/**
 * Creates admin_users table. Requires DATABASE_URL in environment.
 * Usage: DATABASE_URL=postgresql://... node scripts/create-admin-table.cjs
 */
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const c = new Client({ connectionString });

async function main() {
  await c.connect();

  await c.query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  console.log('Table admin_users ready');

  const check = await c.query('SELECT count(*)::text as cnt FROM admin_users');
  if (parseInt(check.rows[0].cnt) === 0) {
    console.log('No admin users found. Create one via the admin panel or hash script.');
  }

  const { rows } = await c.query('SELECT id, username, name FROM admin_users');
  console.log('Admins:', rows);

  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
