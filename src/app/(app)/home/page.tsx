import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const [openIncidents, capaDue, pendingProactive, hipoOpen] = await Promise.all([
    db.incident.count({ where: { status: { notIn: ['CLOSED', 'VOID'] } } }),
    db.capa.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS', 'REOPENED'] }, dueD: { lte: new Date(Date.now() + 7 * 86400000) } } }),
    db.proactiveReport.count({ where: { status: 'NEW' } }),
    db.incident.count({ where: { hipo: true, status: { notIn: ['CLOSED', 'VOID'] } } })
  ]);

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold">Selamat datang, {session.user.name}</h1>
      <p className="mb-6 text-sm text-graphite/60">Keselamatan, terlihat menyeluruh.</p>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Insiden aktif" value={openIncidents} href="/incidents" tone="graphite" />
        <StatCard label="CAPA jatuh tempo ≤7 hari" value={capaDue} href="/capa" tone="amber" />
        <StatCard label="Laporan proaktif baru" value={pendingProactive} href="/proactive" tone="mineral" />
        <StatCard label="Insiden HIPO aktif" value={hipoOpen} href="/incidents" tone="signal" />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <QuickLink href="/incidents/new" label="Lapor Insiden" />
        <QuickLink href="/proactive/new" label="Laporan Proaktif" />
        <QuickLink href="/inspections/new" label="Jadwalkan Inspeksi" />
      </div>
    </div>
  );
}

function StatCard({ label, value, href, tone }: { label: string; value: number; href: string; tone: 'graphite' | 'amber' | 'mineral' | 'signal' }) {
  return (
    <Link href={href} className="prisma-card block p-4 transition-shadow hover:shadow-md">
      <div className={`badge badge-${tone} mb-2`}>{label}</div>
      <div className="text-3xl font-semibold">{value}</div>
    </Link>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="prisma-card flex items-center justify-center p-6 text-sm font-medium hover:bg-graphite/5">
      {label}
    </Link>
  );
}
