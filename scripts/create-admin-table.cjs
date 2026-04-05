const { Client } = require('pg');
const c = new Client({
  connectionString: 'postgresql://postgres:zlWdDNNYCQzDvqbNlfzhLwkSJZjtRYdG@junction.proxy.rlwy.net:55979/railway'
});

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
  console.log('Table created');

  const check = await c.query('SELECT count(*) as cnt FROM admin_users');
  if (parseInt(check.rows[0].cnt) === 0) {
    await c.query(
      'INSERT INTO admin_users (username, password, name) VALUES ($1, $2, $3)',
      ['admin', 'admin123', 'Administrador']
    );
    console.log('Default admin created');
  }

  const { rows } = await c.query('SELECT id, username, name FROM admin_users');
  console.log('Admins:', rows);

  await c.end();
}

main().catch(e => { console.error(e); process.exit(1); });
