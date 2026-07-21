CREATE TABLE IF NOT EXISTS plan_catalog (
  code VARCHAR(30) PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  description TEXT NOT NULL,
  monthly_price_cents INTEGER NOT NULL CHECK (monthly_price_cents >= 0),
  annual_price_cents INTEGER NOT NULL CHECK (annual_price_cents >= 0),
  entitlements JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_public BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO plan_catalog
  (code, name, description, monthly_price_cents, annual_price_cents, entitlements, is_public, sort_order)
VALUES
  ('free', 'Gratuito', 'Para testar o fluxo completo com um evento.', 0, 0,
   '{"active_events.max":1,"team_seats.max":1,"storage.bytes":524288000,"automation_messages.monthly":0,"client_portal.enabled":true,"budget.enabled":false,"day_of.enabled":false,"seating.enabled":false,"checkin.enabled":false,"branding.remove_powered_by":false,"custom_domain.enabled":false,"exports.enabled":false}'::jsonb,
   true, 10),
  ('solo', 'Solo', 'Operação profissional para assessorias independentes.', 8900, 89000,
   '{"active_events.max":5,"team_seats.max":1,"storage.bytes":2147483648,"automation_messages.monthly":0,"client_portal.enabled":true,"budget.enabled":true,"day_of.enabled":true,"seating.enabled":false,"checkin.enabled":false,"branding.remove_powered_by":false,"custom_domain.enabled":false,"exports.enabled":true}'::jsonb,
   true, 20),
  ('pro', 'Pro', 'Equipe, automações e operação completa para crescer.', 17900, 179000,
   '{"active_events.max":20,"team_seats.max":3,"storage.bytes":10737418240,"automation_messages.monthly":500,"client_portal.enabled":true,"budget.enabled":true,"day_of.enabled":true,"seating.enabled":true,"checkin.enabled":true,"branding.remove_powered_by":true,"custom_domain.enabled":false,"exports.enabled":true}'::jsonb,
   true, 30),
  ('studio', 'Studio', 'Marca completa e escala para operações maiores.', 32900, 329000,
   '{"active_events.max":60,"team_seats.max":10,"storage.bytes":32212254720,"automation_messages.monthly":2000,"client_portal.enabled":true,"budget.enabled":true,"day_of.enabled":true,"seating.enabled":true,"checkin.enabled":true,"branding.remove_powered_by":true,"custom_domain.enabled":true,"exports.enabled":true}'::jsonb,
   true, 40),
  ('founders', 'Fundadores', 'Oferta limitada para os primeiros parceiros.', 5900, 59000,
   '{"active_events.max":5,"team_seats.max":2,"storage.bytes":2147483648,"automation_messages.monthly":100,"client_portal.enabled":true,"budget.enabled":true,"day_of.enabled":true,"seating.enabled":false,"checkin.enabled":false,"branding.remove_powered_by":true,"custom_domain.enabled":false,"exports.enabled":true}'::jsonb,
   false, 15)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  monthly_price_cents = EXCLUDED.monthly_price_cents,
  annual_price_cents = EXCLUDED.annual_price_cents,
  entitlements = EXCLUDED.entitlements,
  is_public = EXCLUDED.is_public,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'organizations_plan_code_fk') THEN
    ALTER TABLE organizations
      ADD CONSTRAINT organizations_plan_code_fk
      FOREIGN KEY (plan_code) REFERENCES plan_catalog(code) ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS organization_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_code VARCHAR(30) NOT NULL REFERENCES plan_catalog(code),
  status VARCHAR(24) NOT NULL
    CHECK (status IN ('trialing', 'active', 'past_due', 'grace_period', 'canceled', 'expired')),
  provider VARCHAR(40),
  provider_customer_id TEXT,
  provider_subscription_id TEXT UNIQUE,
  trial_ends_at TIMESTAMPTZ,
  current_period_ends_at TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_live_subscription_per_org
  ON organization_subscriptions(organization_id)
  WHERE status IN ('trialing', 'active', 'past_due', 'grace_period');

CREATE TABLE IF NOT EXISTS plan_upgrade_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  requested_by_user_id UUID NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
  requested_plan_code VARCHAR(30) NOT NULL REFERENCES plan_catalog(code),
  billing_cycle VARCHAR(12) NOT NULL DEFAULT 'monthly'
    CHECK (billing_cycle IN ('monthly', 'annual')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'contacted', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_upgrade_requests_org_status
  ON plan_upgrade_requests(organization_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS billing_webhook_events (
  provider VARCHAR(40) NOT NULL,
  provider_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload_hash VARCHAR(64) NOT NULL,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (provider, provider_event_id)
);

DO $$
DECLARE
  table_name TEXT;
  role_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'plan_catalog', 'organization_subscriptions', 'plan_upgrade_requests', 'billing_webhook_events'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated'] LOOP
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
        EXECUTE format('REVOKE ALL ON TABLE public.%I FROM %I', table_name, role_name);
      END IF;
    END LOOP;
  END LOOP;
END $$;
