-- Production baseline. This migration is intentionally idempotent so existing
-- installations can adopt the versioned migration workflow safely.
CREATE TABLE IF NOT EXISTS platform_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  event_date DATE,
  event_time TIME,
  event_location TEXT,
  theme_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  owner_id UUID REFERENCES platform_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gift_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(500) NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  room VARCHAR(50) NOT NULL DEFAULT 'outro',
  color VARCHAR(255),
  store_name VARCHAR(255),
  store_link TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'disponivel',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gift_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_item_id UUID NOT NULL REFERENCES gift_items(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  guest_name VARCHAR(255),
  guest_email VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'pendente',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS guest_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  guest_name VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rsvp_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  guest_name VARCHAR(255) NOT NULL,
  guest_email VARCHAR(255) NOT NULL,
  guests_count INTEGER NOT NULL DEFAULT 1,
  dietary_restrictions TEXT,
  message TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'confirmado',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Kept for compatibility while media is migrated to object storage.
CREATE TABLE IF NOT EXISTS uploaded_images (
  path TEXT PRIMARY KEY,
  mime_type VARCHAR(100) NOT NULL,
  data BYTEA NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Legacy table: no longer used by the application authorization path.
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE gift_items ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES platform_users(id) ON DELETE SET NULL;
ALTER TABLE platform_users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_gift_items_tenant ON gift_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gift_items_status ON gift_items(status);
CREATE INDEX IF NOT EXISTS idx_gift_reservations_gift ON gift_reservations(gift_item_id);
CREATE INDEX IF NOT EXISTS idx_gift_reservations_tenant ON gift_reservations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_guest_messages_tenant ON guest_messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rsvp_entries_tenant ON rsvp_entries(tenant_id);
