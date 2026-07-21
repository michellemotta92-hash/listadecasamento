/**
 * One-off: hash plaintext admin passwords. Requires DATABASE_URL.
 * Usage: npx tsx scripts/hash-admin-passwords.ts
 */
import bcrypt from 'bcrypt';
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const { rows } = await pool.query<{ id: string; password: string }>(
    'SELECT id, password FROM admin_users'
  );

  for (const row of rows) {
    if (row.password.startsWith('$2')) {
      console.log(`Skip ${row.id} (already hashed)`);
      continue;
    }
    const hashed = await bcrypt.hash(row.password, 10);
    await pool.query('UPDATE admin_users SET password = $1 WHERE id = $2', [hashed, row.id]);
    console.log(`Hashed password for ${row.id}`);
  }

  await pool.end();
  console.log('Done');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
