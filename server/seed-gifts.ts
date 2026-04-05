/**
 * Seed gift items from real-data.ts into PostgreSQL
 * Run: npx tsx server/seed-gifts.ts
 */
import { pool, query, queryOne } from './db.js';

// Import real data directly
import { realGifts } from '../src/lib/real-data.js';

async function seed() {
  console.log('Seeding gift items...');

  const tenant = await queryOne<{ id: string }>('SELECT id FROM tenants WHERE slug = $1', ['miejohn']);
  if (!tenant) {
    console.error('Tenant "miejohn" not found. Run migration first: npx tsx server/migrate.ts');
    process.exit(1);
  }

  const tenantId = tenant.id;

  // Check if gifts already exist
  const existing = await query('SELECT COUNT(*) as c FROM gift_items WHERE tenant_id = $1', [tenantId]);
  if (parseInt(existing[0].c) > 0) {
    console.log(`${existing[0].c} gifts already exist. Skipping seed.`);
    console.log('To re-seed, run: DELETE FROM gift_items WHERE tenant_id = (SELECT id FROM tenants WHERE slug = \'miejohn\');');
    await pool.end();
    return;
  }

  let count = 0;
  for (const gift of realGifts) {
    await query(
      `INSERT INTO gift_items (tenant_id, name, description, price, room, color, store_name, store_link, status, is_featured, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        tenantId,
        gift.name,
        gift.description,
        gift.price,
        gift.room,
        gift.color,
        gift.store_name,
        gift.store_link,
        gift.status,
        gift.is_featured,
        gift.image_url,
      ]
    );
    count++;
  }

  console.log(`${count} gifts seeded successfully!`);
  await pool.end();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
