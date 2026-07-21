-- Organizations are the commercial account; tenants are the events/sites.
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(160) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'cancelled')),
  plan_code VARCHAR(30) NOT NULL DEFAULT 'free',
  brand_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by_user_id UUID REFERENCES platform_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organization_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'viewer'
    CHECK (role IN ('owner', 'admin', 'planner', 'coordinator', 'viewer')),
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('invited', 'active', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, user_id)
);

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE RESTRICT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'published';
ALTER TABLE uploaded_images ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE gift_reservations ADD COLUMN IF NOT EXISTS confirmation_token_hash VARCHAR(64);
ALTER TABLE guest_messages ALTER COLUMN is_approved SET DEFAULT false;

-- Backfill one account per existing platform user.
INSERT INTO organizations (name, slug, created_by_user_id)
SELECT
  COALESCE(NULLIF(TRIM(u.name), ''), split_part(u.email, '@', 1), 'Minha assessoria'),
  'org-' || LEFT(REPLACE(u.id::text, '-', ''), 20),
  u.id
FROM platform_users u
WHERE NOT EXISTS (
  SELECT 1 FROM organizations o WHERE o.created_by_user_id = u.id
);

INSERT INTO organization_memberships (organization_id, user_id, role, status)
SELECT o.id, o.created_by_user_id, 'owner', 'active'
FROM organizations o
WHERE o.created_by_user_id IS NOT NULL
ON CONFLICT (organization_id, user_id) DO NOTHING;

UPDATE tenants t
SET organization_id = o.id
FROM organizations o
WHERE t.organization_id IS NULL
  AND t.owner_id IS NOT NULL
  AND o.created_by_user_id = t.owner_id;

-- Ownerless legacy events are quarantined in an account with no members. They
-- remain public but cannot be edited until an operator explicitly assigns them.
INSERT INTO organizations (name, slug, status, plan_code)
SELECT 'Eventos legados sem responsável', 'legacy-unassigned', 'suspended', 'free'
WHERE EXISTS (SELECT 1 FROM tenants WHERE organization_id IS NULL)
  AND NOT EXISTS (SELECT 1 FROM organizations WHERE slug = 'legacy-unassigned');

UPDATE tenants
SET organization_id = (SELECT id FROM organizations WHERE slug = 'legacy-unassigned')
WHERE organization_id IS NULL;

ALTER TABLE tenants ALTER COLUMN organization_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_organizations_created_by ON organizations(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user_active ON organization_memberships(user_id, status);
CREATE INDEX IF NOT EXISTS idx_memberships_organization ON organization_memberships(organization_id);
CREATE INDEX IF NOT EXISTS idx_tenants_organization ON tenants(organization_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_images_tenant ON uploaded_images(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reservations_confirmation_hash ON gift_reservations(confirmation_token_hash);

-- The Express API uses a private Postgres connection. Public Data API roles get
-- no implicit access; authorization is always checked at the API boundary.
DO $$
DECLARE
  table_name TEXT;
  role_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'organizations', 'organization_memberships', 'tenants', 'gift_items',
    'gift_reservations', 'guest_messages', 'rsvp_entries', 'uploaded_images',
    'platform_users', 'admin_users'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated'] LOOP
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
        EXECUTE format('REVOKE ALL ON TABLE public.%I FROM %I', table_name, role_name);
      END IF;
    END LOOP;
  END LOOP;
END $$;
