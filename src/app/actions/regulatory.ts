'use server';

import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { newId } from '@/lib/ids';
import { assertCan } from '@/lib/rbac';
import { recordAudit } from '@/lib/audit';
import { computeKpiSnapshot } from '@/lib/kpi';

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  return session;
}

export async function generateKpiSnapshotAction(siteId: string | null, period: string) {
  const session = await requireSession();
  assertCan(session.user.role, 'regulatory', 'export');
  await computeKpiSnapshot(siteId, period);
  revalidatePath('/dashboard');
}

export async function generateMonthlyReportAction(clientId: string, period: string) {
  const session = await requireSession();
  assertCan(session.user.role, 'regulatory', 'export');

  const [year, month] = period.split('-').map(Number);
  const periodStart = new Date(Date.UTC(year, month - 1, 1));
  const periodEnd = new Date(Date.UTC(year, month, 1));

  const incidents = await db.incident.findMany({
    where: { clientId, incidentDt: { gte: periodStart, lt: periodEnd }, statsIncluded: true, status: { not: 'VOID' } },
    include: { victims: true, site: true }
  });

  const snapshot = {
    period,
    clientId,
    totalIncidents: incidents.length,
    byIndClass: incidents.reduce<Record<string, number>>((acc, i) => {
      acc[i.indClass] = (acc[i.indClass] ?? 0) + 1;
      return acc;
    }, {}),
    items: incidents.map((i) => ({ humanNo: i.humanNo, title: i.title, site: i.site.name, indClass: i.indClass, regClass: i.regClass, incidentDt: i.incidentDt }))
  };

  const id = newId();
  await db.regReport.create({
    data: { id, kind: 'BULANAN_1806', clientId, period, snapshot, status: 'DRAFT' }
  });
  await recordAudit({ actorId: session.user.id, role: session.user.role, entity: 'RegReport', entityId: id, action: 'CREATE' });
  revalidatePath('/regulatory');
}

export async function sendRegReportAction(reportId: string, channel: string, recipient: string, receiptRef: string) {
  const session = await requireSession();
  assertCan(session.user.role, 'regulatory', 'export');
  await db.regReport.update({
    where: { id: reportId },
    data: { status: 'SENT', channel, recipient, receiptRef, sentDt: new Date() }
  });
  await recordAudit({ actorId: session.user.id, role: session.user.role, entity: 'RegReport', entityId: reportId, action: 'EXPORT', reason: receiptRef });
  revalidatePath('/regulatory');
}
