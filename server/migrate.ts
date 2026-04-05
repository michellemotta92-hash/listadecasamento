import { pool, query } from './db.js';

const MIGRATION_SQL = `
-- Tenants
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  event_date DATE,
  event_time TIME,
  event_location TEXT,
  theme_config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gift Items
CREATE TABLE IF NOT EXISTS gift_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(500) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  room VARCHAR(50) NOT NULL DEFAULT 'outro',
  color VARCHAR(255),
  store_name VARCHAR(255),
  store_link TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'disponivel',
  is_featured BOOLEAN DEFAULT false,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gift Reservations
CREATE TABLE IF NOT EXISTS gift_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_item_id UUID REFERENCES gift_items(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  guest_name VARCHAR(255),
  guest_email VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'pendente',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guest Messages
CREATE TABLE IF NOT EXISTS guest_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  guest_name VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RSVP Entries
CREATE TABLE IF NOT EXISTS rsvp_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  guest_name VARCHAR(255) NOT NULL,
  guest_email VARCHAR(255) NOT NULL,
  guests_count INTEGER DEFAULT 1,
  dietary_restrictions TEXT,
  message TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'confirmado',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sort order for gift items
ALTER TABLE gift_items ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gift_items_tenant ON gift_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gift_items_status ON gift_items(status);
CREATE INDEX IF NOT EXISTS idx_gift_reservations_gift ON gift_reservations(gift_item_id);
CREATE INDEX IF NOT EXISTS idx_gift_reservations_tenant ON gift_reservations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_guest_messages_tenant ON guest_messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rsvp_entries_tenant ON rsvp_entries(tenant_id);
`;

async function migrate() {
  console.log('Running migration...');
  await pool.query(MIGRATION_SQL);
  console.log('Tables created successfully.');

  // Seed default tenant if not exists
  const existing = await query('SELECT id FROM tenants WHERE slug = $1', ['miejohn']);
  if (existing.length === 0) {
    await query(
      `INSERT INTO tenants (name, slug, event_date, event_time, event_location, theme_config)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      ['Mi & John', 'miejohn', '2026-10-12', '16:00', 'Fazenda Paraíso, São Paulo, SP', '{}']
    );
    console.log('Default tenant "miejohn" created.');
  } else {
    console.log('Tenant "miejohn" already exists.');
  }

  // Seed sample messages
  const tenant = await query<{ id: string }>('SELECT id FROM tenants WHERE slug = $1', ['miejohn']);
  const tenantId = tenant[0].id;

  const msgCount = await query('SELECT COUNT(*) as c FROM guest_messages WHERE tenant_id = $1', [tenantId]);
  if (parseInt(msgCount[0].c) === 0) {
    const messages = [
      { name: 'Ana Paula', msg: 'Que Deus abençoe essa união! Muitas felicidades ao casal mais lindo! 💕' },
      { name: 'Carlos e Fernanda', msg: 'Estamos muito felizes por vocês! Será o casamento mais bonito do ano!' },
      { name: 'Vovó Maria', msg: 'Meus netos queridos, que essa nova jornada seja repleta de amor e saúde. Amo vocês!' },
    ];
    for (const m of messages) {
      await query(
        'INSERT INTO guest_messages (tenant_id, guest_name, message) VALUES ($1, $2, $3)',
        [tenantId, m.name, m.msg]
      );
    }
    console.log('Sample messages seeded.');
  }

  console.log('Migration complete!');
  await pool.end();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
