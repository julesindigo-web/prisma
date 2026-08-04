import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { StatusBadge } from '@/components/status-badge';

export default async function InspectionsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const records = await db.inspectionRecord.findMany({
    include: { template: true, site: true, equipment: true, performer: { include: { worker: true } } },
    orderBy: { dt: 'desc' },
    take: 100
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Inspeksi / P2H</h1>
        <Link href="/inspections/new" className="btn-primary">+ Jadwalkan Inspeksi</Link>
      </div>

      <div className="prisma-card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-graphite/10 text-xs uppercase text-graphite/50">
            <tr>
              <th className="px-4 py-3">No.</th>
              <th className="px-4 py-3">Template</th>
              <th className="px-4 py-3">Site / Unit</th>
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">Pelaksana</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="border-b border-graphite/5 hover:bg-graphite/5">
                <td className="px-4 py-3">
                  <Link href={`/inspections/${r.id}`} className="font-medium text-mineral hover:underline">{r.humanNo}</Link>
                </td>
                <td className="px-4 py-3">{r.template.name}</td>
                <td className="px-4 py-3">{r.site.name}{r.equipment ? ` / ${r.equipment.unitCode}` : ''}</td>
                <td className="px-4 py-3">{r.dt.toISOString().slice(0, 10)}</td>
                <td className="px-4 py-3">{r.performer.worker.name}</td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
              </tr>
            ))}
            {records.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-graphite/40">Belum ada data inspeksi.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
