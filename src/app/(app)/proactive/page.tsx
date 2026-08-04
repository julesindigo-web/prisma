import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { StatusBadge } from '@/components/status-badge';
import { ProactiveStageActions } from '@/components/proactive-actions';

export default async function ProactivePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const reports = await db.proactiveReport.findMany({ include: { site: true }, orderBy: { createdAt: 'desc' }, take: 100 });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Laporan Proaktif</h1>
        <Link href="/proactive/new" className="btn-primary">+ Buat Laporan</Link>
      </div>

      <div className="prisma-card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-graphite/10 text-xs uppercase text-graphite/50">
            <tr>
              <th className="px-4 py-3">No.</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Site</th>
              <th className="px-4 py-3">Pelapor</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id} className="border-b border-graphite/5 hover:bg-graphite/5">
                <td className="px-4 py-3 font-medium">{r.humanNo}</td>
                <td className="px-4 py-3">{r.category}</td>
                <td className="px-4 py-3">{r.site.name}</td>
                <td className="px-4 py-3">{r.anonymous ? <span className="badge badge-graphite">Anonim</span> : 'Terdaftar'}</td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3"><ProactiveStageActions reportId={r.id} status={r.status} /></td>
              </tr>
            ))}
            {reports.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-graphite/40">Belum ada laporan proaktif.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
