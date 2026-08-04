import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { isOwnScoped, isSiteScoped } from '@/lib/rbac';
import { StatusBadge } from '@/components/status-badge';

export default async function IncidentsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const where: any = { status: { not: 'VOID' } };
  if (isOwnScoped(session.user.role)) {
    where.createdBy = session.user.id;
  } else if (isSiteScoped(session.user.role)) {
    const deployments = await db.workerDeployment.findMany({ where: { workerId: session.user.workerId, status: 'ACTIVE' } });
    where.siteId = { in: deployments.map((d) => d.siteId) };
  }

  const incidents = await db.incident.findMany({
    where,
    include: { site: true, client: true, victims: true },
    orderBy: { incidentDt: 'desc' },
    take: 100
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Insiden</h1>
        <Link href="/incidents/new" className="btn-primary">+ Lapor Insiden</Link>
      </div>

      <div className="prisma-card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-graphite/10 text-xs uppercase text-graphite/50">
            <tr>
              <th className="px-4 py-3">No.</th>
              <th className="px-4 py-3">Judul</th>
              <th className="px-4 py-3">Site</th>
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">Klasifikasi</th>
              <th className="px-4 py-3">HIPO</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {incidents.map((inc) => (
              <tr key={inc.id} className="border-b border-graphite/5 hover:bg-graphite/5">
                <td className="px-4 py-3">
                  <Link href={`/incidents/${inc.id}`} className="font-medium text-mineral hover:underline">{inc.humanNo}</Link>
                </td>
                <td className="px-4 py-3">{inc.title}</td>
                <td className="px-4 py-3">{inc.site.name}</td>
                <td className="px-4 py-3">{inc.incidentDt.toISOString().slice(0, 16).replace('T', ' ')}</td>
                <td className="px-4 py-3">{inc.indClass}</td>
                <td className="px-4 py-3">{inc.hipo && <span className="badge badge-signal">HIPO</span>}</td>
                <td className="px-4 py-3"><StatusBadge status={inc.status} /></td>
              </tr>
            ))}
            {incidents.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-graphite/40">Belum ada data insiden.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
