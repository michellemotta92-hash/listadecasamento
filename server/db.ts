import pg from 'pg';

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL
  || 'postgresql://postgres:zlWdDNNYCQzDvqbNlfzhLwkSJZjtRYdG@junction.proxy.rlwy.net:55979/railway';

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err);
});

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  const result = await pool.query(text, params);
  return (result.rows[0] as T) || null;
}
