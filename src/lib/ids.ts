import { ulid } from 'ulid';
import { db } from './db';

/** Technical ID per §0.1 — ULID, sortable & collision-safe. */
export function newId(): string {
  return ulid();
}

const PAD = 4;

/**
 * Human-readable ID per §0.1: PRS-{ENT}-{YYYYMM}-{####}
 * Sequenced monthly via a global Sequencer row (guards against duplicate numbers under concurrency).
 */
export async function nextHumanNo(entity: 'INC' | 'CAP' | 'INS' | 'PRW' | 'PTW' | 'RPT'): Promise<string> {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

  const seq = await db.$transaction(async (tx) => {
    const existing = await tx.sequencer.findUnique({
      where: { entity_yearMonth: { entity, yearMonth } }
    });
    if (existing) {
      return tx.sequencer.update({
        where: { id: existing.id },
        data: { lastValue: existing.lastValue + 1 }
      });
    }
    return tx.sequencer.create({
      data: { id: newId(), entity, yearMonth, lastValue: 1 }
    });
  });

  return `PRS-${entity}-${yearMonth}-${String(seq.lastValue).padStart(PAD, '0')}`;
}
