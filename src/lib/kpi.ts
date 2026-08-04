import { db } from './db';
import { newId } from './ids';

const RECORDABLE_CLASSES = ['FAI', 'MTI', 'RWTC', 'LTI', 'FAT'];

export function methodologyNote(period: string, rev: number): string {
  return `Metodologi: recordable=FAI+MTI+RWTC+LTI+Fatality; FR/SR per 1.000.000 jam kerja orang; 2 desimal; periode ${period}; rev ${rev}; dicetak ${new Date().toISOString()}`;
}

/** §9 ANALITIK — FR = (recordable count × 1e6) / man-hours; SR = (lost days × 1e6) / man-hours. */
export async function computeKpiSnapshot(siteId: string | null, period: string) {
  const [year, month] = period.split('-').map(Number);
  const periodStart = new Date(Date.UTC(year, month - 1, 1));
  const periodEnd = new Date(Date.UTC(year, month, 1));

  const incidents = await db.incident.findMany({
    where: {
      ...(siteId ? { siteId } : {}),
      statsIncluded: true,
      status: { not: 'VOID' },
      incidentDt: { gte: periodStart, lt: periodEnd }
    },
    include: { victims: true }
  });

  const recordableCount = incidents.filter((i) => RECORDABLE_CLASSES.includes(i.indClass)).length;
  const totalLostDays = incidents.reduce((sum, i) => sum + i.victims.reduce((s, v) => s + v.lostDays, 0), 0);
  const hazardCount = incidents.filter((i) => i.indClass === 'NM').length;

  const manHoursRows = await db.manHoursInput.findMany({
    where: { ...(siteId ? { siteId } : {}), period }
  });
  const manHours = manHoursRows.reduce((sum, r) => sum + r.hours, 0);

  const fr = manHours > 0 ? round2((recordableCount * 1_000_000) / manHours) : 0;
  const sr = manHours > 0 ? round2((totalLostDays * 1_000_000) / manHours) : 0;

  const capas = await db.capa.findMany({ where: { createdAt: { gte: periodStart, lt: periodEnd } } });
  const capaOnTime = capas.length > 0 ? round2((capas.filter((c) => c.status === 'CLOSED' && c.verifyDt && c.verifyDt <= c.dueD).length / capas.length) * 100) : null;

  const inspections = await db.inspectionRecord.findMany({
    where: { ...(siteId ? { siteId } : {}), dt: { gte: periodStart, lt: periodEnd } }
  });
  const inspectionCompliance = inspections.length > 0 ? round2((inspections.filter((i) => i.status === 'DONE' || i.status === 'CLOSED').length / inspections.length) * 100) : null;

  const leading = {
    nearMissRate: hazardCount,
    capaOnTimePct: capaOnTime,
    inspectionCompliancePct: inspectionCompliance
  };

  const rev = 1;
  const note = methodologyNote(period, rev);

  return db.kpiSnapshot.create({
    data: {
      id: newId(),
      scope: siteId ?? 'HQ',
      siteId: siteId ?? undefined,
      period,
      manHours,
      fr,
      sr,
      leading,
      methodologyNote: note,
      rev
    }
  });
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
