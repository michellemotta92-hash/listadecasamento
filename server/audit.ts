import { query } from './db.js';

export async function writeAuditLog(input: {
  organizationId: string;
  tenantId?: string;
  actorUserId: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await query(
    `INSERT INTO audit_logs
       (organization_id, tenant_id, actor_user_id, action, target_type, target_id, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      input.organizationId,
      input.tenantId || null,
      input.actorUserId,
      input.action,
      input.targetType,
      input.targetId || null,
      JSON.stringify(input.metadata || {}),
    ]
  );
}
