DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenants_id_organization_unique'
  ) THEN
    ALTER TABLE tenants
      ADD CONSTRAINT tenants_id_organization_unique UNIQUE (id, organization_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS event_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  title VARCHAR(240) NOT NULL,
  description TEXT,
  status VARCHAR(24) NOT NULL DEFAULT 'todo'
    CHECK (status IN ('todo', 'in_progress', 'blocked', 'done', 'cancelled')),
  priority VARCHAR(16) NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date DATE,
  visibility VARCHAR(16) NOT NULL DEFAULT 'internal'
    CHECK (visibility IN ('internal', 'client')),
  assigned_to_user_id UUID REFERENCES platform_users(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  created_by_user_id UUID REFERENCES platform_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT event_tasks_tenant_organization_fk
    FOREIGN KEY (tenant_id, organization_id)
    REFERENCES tenants(id, organization_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_event_tasks_tenant_status_due
  ON event_tasks(tenant_id, status, due_date);
CREATE INDEX IF NOT EXISTS idx_event_tasks_assignee
  ON event_tasks(assigned_to_user_id, status, due_date);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  actor_user_id UUID REFERENCES platform_users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(80) NOT NULL,
  target_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_org_created
  ON audit_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_created
  ON audit_logs(tenant_id, created_at DESC);

DO $$
DECLARE
  table_name TEXT;
  role_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['event_tasks', 'audit_logs'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated'] LOOP
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
        EXECUTE format('REVOKE ALL ON TABLE public.%I FROM %I', table_name, role_name);
      END IF;
    END LOOP;
  END LOOP;
END $$;
