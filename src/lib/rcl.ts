import { db } from './db';

export class RclPendingError extends Error {
  code = 'RCL_423';
  constructor(key: string) {
    super(`RCL constant "${key}" is PENDING_TRANSCRIPTION — cannot be used in production. See §2.2 Antrian Transkripsi Verbatim.`);
  }
}

/** Numeric RCL constant lookup (deadlines, thresholds). Falls back to seeded default when absent. */
export async function getRclNumber(key: string, fallback: number): Promise<number> {
  const row = await db.rclConstant.findUnique({ where: { key } });
  if (!row) return fallback;
  if (row.status === 'PENDING_TRANSCRIPTION' && process.env.NODE_ENV === 'production') {
    throw new RclPendingError(key);
  }
  const n = Number(row.value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * §0.2 Doctrine #2 + §2.2 — guard against shipping unverified regulatory values to production.
 * Call before any transition that finalizes a regulator-facing classification.
 */
export function assertRegClassProdReady(regClass: string) {
  if (regClass === 'PENDING_TRANSCRIPTION' && process.env.NODE_ENV === 'production') {
    throw new RclPendingError('reg_class');
  }
}

export const RCL_KEYS = {
  INVESTIGATION_DEADLINE_HOURS: 'INVESTIGATION_DEADLINE_HOURS',
  DISNAKER_REPORT_DEADLINE_HOURS: 'DISNAKER_REPORT_DEADLINE_HOURS',
  ESCALATE_BEFORE_HOURS: 'ESCALATE_BEFORE_HOURS',
  HAZARD_RESPONSE_HOURS: 'HAZARD_RESPONSE_HOURS',
  CAPA_DUE_P1_DAYS: 'CAPA_DUE_P1_DAYS',
  CAPA_DUE_P2_DAYS: 'CAPA_DUE_P2_DAYS',
  CAPA_DUE_P3_DAYS: 'CAPA_DUE_P3_DAYS',
  MANHOURS_VARIANCE_PCT: 'MANHOURS_VARIANCE_PCT',
  HIPO_SEVERITY_THRESHOLD: 'HIPO_SEVERITY_THRESHOLD',
  RECURRENCE_WINDOW_HOURS: 'RECURRENCE_WINDOW_HOURS'
} as const;
