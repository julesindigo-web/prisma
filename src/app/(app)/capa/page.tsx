import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { StatusBadge } from '@/components/status-badge';

const COLUMNS = [
  { status: 'OPEN', label: 'Open' },
  { status: 'IN_PROGRESS', label: 'In Progress' },
  { status: 'AWAITING_VERIFICATION', label: 'Menunggu Verifikasi' },
  { status: 'CLOSED', label: 'Closed' },
  { status: 'REOPENED', label: 'Reopened' }
];

export default async function CapaBoardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const capas = await db.capa.findMany({ include: { pic: true }, orderBy: { dueD: 'asc' } });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">CAPA Board</h1>
        <Link href="/capa/new" className="btn-primary">+ Buat CAPA</Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        {COLUMNS.map((col) => {
          const items = capas.filter((c) => c.status === col.status);
          const overdue = (c: (typeof capas)[number]) => c.dueD.getTime() < Date.now() && c.status !== 'CLOSED';
          return (
            <div key={col.status} className="prisma-card p-3">
              <h2 className="mb-2 text-xs font-semibold uppercase text-graphite/50">{col.label} ({items.length})</h2>
              <div className="space-y-2">
                {items.map((c) => (
                  <Link key={c.id} href={`/capa/${c.id}`} className="block rounded-prisma border border-graphite/10 p-2 text-xs hover:bg-graphite/5">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-medium">{c.humanNo}</span>
                      <span className="badge badge-graphite">{c.priority}</span>
                    </div>
                    <p className="mb-1 line-clamp-2 text-graphite/70">{c.action}</p>
                    <div className="flex items-center justify-between text-[10px] text-graphite/50">
                      <span>{c.pic.name}</span>
                      <span className={overdue(c) ? 'text-signal font-semibold' : ''}>{c.dueD.toISOString().slice(0, 10)}</span>
                    </div>
                    {c.recurrenceFlag && <span className="badge badge-signal mt-1">Rekurensi</span>}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
