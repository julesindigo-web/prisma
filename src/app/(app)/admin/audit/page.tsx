import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { assertCan } from '@/lib/rbac';

export default async function AuditPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  assertCan(session.user.role, 'admin', 'read');

  const events = await db.auditEvent.findMany({
    include: { actor: { include: { worker: true } } },
    orderBy: { ts: 'desc' },
    take: 200
  });

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Log Audit (append-only)</h1>
      <div className="prisma-card overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-graphite/10 text-graphite/50">
            <tr>
              <th className="px-3 py-2">Waktu</th>
              <th className="px-3 py-2">Aktor</th>
              <th className="px-3 py-2">Entitas</th>
              <th className="px-3 py-2">Aksi</th>
              <th className="px-3 py-2">Alasan</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-b border-graphite/5">
                <td className="px-3 py-2">{e.ts.toISOString().replace('T', ' ').slice(0, 19)}</td>
                <td className="px-3 py-2">{e.actor?.worker.name ?? 'Sistem'}</td>
                <td className="px-3 py-2">{e.entity} #{e.entityId.slice(0, 8)}</td>
                <td className="px-3 py-2"><span className="badge badge-graphite">{e.action}</span></td>
                <td className="px-3 py-2">{e.reason ?? '—'}</td>
              </tr>
            ))}
            {events.length === 0 && <tr><td colSpan={5} className="px-3 py-8 text-center text-graphite/40">Belum ada log.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
