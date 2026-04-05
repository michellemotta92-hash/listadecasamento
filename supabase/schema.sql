-- Enums
CREATE TYPE room_type AS ENUM ('sala', 'cozinha', 'banheiro', 'lavanderia', 'quarto', 'outro');
CREATE TYPE gift_status AS ENUM ('disponivel', 'reservado', 'comprado');
CREATE TYPE reservation_status AS ENUM ('pendente', 'confirmada', 'cancelada', 'expirada');

-- Tenants
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  event_date TIMESTAMPTZ,
  theme_config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenant Domains
CREATE TABLE tenant_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  domain VARCHAR(255) UNIQUE NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_tenant_domains_domain ON tenant_domains(domain);

-- Admin Profiles (extends auth.users)
CREATE TABLE admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenant Admin Memberships
CREATE TABLE tenant_admin_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES admin_profiles(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, admin_id)
);

-- Pages
CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, slug)
);

-- Page Blocks
CREATE TABLE page_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gift Items
CREATE TABLE gift_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  room room_type NOT NULL,
  color VARCHAR(100),
  store_name VARCHAR(100),
  store_link VARCHAR(1024),
  status gift_status DEFAULT 'disponivel',
  image_url VARCHAR(1024),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gift Reservations
CREATE TABLE gift_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_item_id UUID REFERENCES gift_items(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  guest_name VARCHAR(255),
  guest_email VARCHAR(255),
  status reservation_status DEFAULT 'pendente',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gift Events (Audit)
CREATE TABLE gift_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_item_id UUID REFERENCES gift_items(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES gift_reservations(id) ON DELETE SET NULL,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies (Examples)
ALTER TABLE gift_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view tenant gifts" ON gift_items
  FOR SELECT
  USING (true); -- In practice, filtered by tenant_id in the query

CREATE POLICY "Admins can manage their tenant gifts" ON gift_items
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_admin_memberships WHERE admin_id = auth.uid()
    )
  );
