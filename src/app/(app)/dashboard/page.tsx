import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateKpiSnapshotAction } from '@/app/actions/regulatory';
import { recordManHoursAction } from '@/app/actions/master';

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const period = currentPeriod();
  const [latestSnapshot, sites, clients, incidentsByClass] = await Promise.all([
    db.kpiSnapshot.findFirst({ where: { period }, orderBy: { createdAt: 'desc' } }),
    db.site.findMany({ where: { active: true } }),
    db.client.findMany({ where: { active: true } }),
    db.incident.groupBy({ by: ['indClass'], _count: { indClass: true }, where: { status: { not: 'VOID' } } })
  ]);

  async function generateAction() {
    'use server';
    await generateKpiSnapshotAction(null, period);
  }
  async function manHoursAction(formData: FormData) {
    'use server';
    await recordManHoursAction(formData);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dasbor &amp; KPI — {period}</h1>
        <form action={generateAction}>
          <button className="btn-primary text-sm" type="submit">Hitung Ulang KPI Bulan Ini</button>
        </form>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Frequency Rate (FR)" value={latestSnapshot?.fr ?? 0} />
        <KpiCard label="Severity Rate (SR)" value={latestSnapshot?.sr ?? 0} />
        <KpiCard label="Jam kerja" value={latestSnapshot?.manHours ?? 0} />
        <KpiCard label="Near-miss rate" value={(latestSnapshot?.leading as any)?.nearMissRate ?? 0} />
      </div>

      {latestSnapshot && (
        <p className="text-xs text-graphite/50">{latestSnapshot.methodologyNote}</p>
      )}

      <div className="prisma-card p-4">
        <h2 className="mb-3 text-sm font-semibold">Distribusi Klasifikasi Insiden</h2>
        <div className="flex flex-wrap gap-3">
          {incidentsByClass.map((row) => (
            <div key={row.indClass} className="rounded-prisma border border-graphite/10 px-3 py-2 text-sm">
              <span className="font-semibold">{row._count.indClass}</span> <span className="text-graphite/50">{row.indClass}</span>
            </div>
          ))}
          {incidentsByClass.length === 0 && <p className="text-sm text-graphite/40">Belum ada data.</p>}
        </div>
      </div>

      <div className="prisma-card p-4">
        <h2 className="mb-3 text-sm font-semibold">Input Jam Kerja (Man-Hours)</h2>
        <form action={manHoursAction} className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <select name="clientId" required className="field-input">
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select name="siteId" required className="field-input">
            {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input name="period" defaultValue={period} required className="field-input" placeholder="YYYY-MM" />
          <input name="hours" type="number" step="0.01" required className="field-input" placeholder="Total jam" />
          <input name="headcount" type="number" required className="field-input" placeholder="Headcount" />
          <button type="submit" className="btn-secondary col-span-2 md:col-span-1">Simpan</button>
        </form>
      </div>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="prisma-card p-4">
      <div className="mb-1 text-xs text-graphite/50">{label}</div>
      <div className="text-2xl font-semibold">{value.toFixed(2)}</div>
    </div>
  );
}
