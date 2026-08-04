import { db } from './db';
import { newId } from './ids';

interface AuditInput {
  actorId?: string | null;
  role?: string | null;
  entity: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'TRANSITION' | 'VOID' | 'EXPORT';
  before?: unknown;
  after?: unknown;
  reason?: string;
  device?: string;
  gpsLat?: number;
  gpsLng?: number;
}

/** §0.2-4 Immutable audit log — append-only, never updated or deleted. */
export async function recordAudit(input: AuditInput) {
  await db.auditEvent.create({
    data: {
      id: newId(),
      actorId: input.actorId ?? null,
      role: input.role ?? null,
      entity: input.entity,
      entityId: input.entityId,
      action: input.action,
      before: input.before === undefined ? undefined : (input.before as any),
      after: input.after === undefined ? undefined : (input.after as any),
      reason: input.reason,
      device: input.device,
      gpsLat: input.gpsLat,
      gpsLng: input.gpsLng
    }
  });
}
