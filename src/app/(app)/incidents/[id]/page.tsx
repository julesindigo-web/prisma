import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { can } from '@/lib/rbac';
import { StatusBadge } from '@/components/status-badge';
import { SubmitIncidentButton, VoidIncidentButton, StartInvestigationForm } from '@/components/incident-actions';

export default async function IncidentDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const incident = await db.incident.findUnique({
    where: { id: params.id },
    include: {
      client: true,
      site: true,
      location: true,
      victims: { include: { worker: true } },
      witnesses: { include: { worker: true } },
      evidence: true,
      equipmentLinks: { include: { equipment: true } },
      investigation: true,
      capas: { include: { pic: true } }
    }
  });
  if (!incident) notFound();

  const users = await db.userAccount.findMany({ where: { active: true }, include: { worker: true } });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <h1 className="text-xl font-semibold">{incident.humanNo}</h1>
            <StatusBadge status={incident.status} />
            {incident.hipo && <span className="badge badge-signal">HIPO</span>}
          </div>
          <p className="text-sm text-graphite/60">{incident.title}</p>
        </div>
        <Link href="/incidents" className="btn-secondary text-xs">Kembali</Link>
      </div>

      <div className="prisma-card grid grid-cols-2 gap-4 p-4 text-sm md:grid-cols-3">
        <Field label="Client" value={incident.client.name} />
        <Field label="Site" value={incident.site.name} />
        <Field label="Lokasi" value={incident.location?.name ?? '—'} />
        <Field label="Tanggal kejadian" value={incident.incidentDt.toISOString().slice(0, 16).replace('T', ' ')} />
        <Field label="Shift" value={incident.shift} />
        <Field label="reg_type / reg_class" value={`${incident.regType} / ${incident.regClass}`} />
        <Field label="ind_class" value={incident.indClass} />
        <Field label="Kategori manajemen" value={incident.mgmtCategory} />
        <Field label="Potensi keparahan" value={String(incident.potentialSev)} />
      </div>

      <div className="prisma-card p-4">
        <h2 className="mb-2 text-sm font-semibold">Kronologi</h2>
        <p className="whitespace-pre-wrap text-sm text-graphite/80">{incident.description}</p>
      </div>

      {incident.victims.length > 0 && (
        <div className="prisma-card p-4">
          <h2 className="mb-2 text-sm font-semibold">Korban</h2>
          <table className="w-full text-left text-xs">
            <thead className="text-graphite/50"><tr><th className="py-1">Nama</th><th>Outcome</th><th>Hari hilang</th></tr></thead>
            <tbody>
              {incident.victims.map((v) => (
                <tr key={v.id} className="border-t border-graphite/5">
                  <td className="py-1">{v.worker.name}</td><td>{v.outcome}</td><td>{v.lostDays}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {incident.equipmentLinks.length > 0 && (
        <div className="prisma-card p-4">
          <h2 className="mb-2 text-sm font-semibold">Peralatan terlibat</h2>
          <div className="flex flex-wrap gap-2">
            {incident.equipmentLinks.map((l) => <span key={l.id} className="badge badge-graphite">{l.equipment.unitCode}</span>)}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {incident.status === 'DRAFT' && can(session.user.role, 'incident', 'update') && (
          <SubmitIncidentButton incidentId={incident.id} />
        )}
        {can(session.user.role, 'incident', 'void') && incident.status !== 'VOID' && incident.status !== 'CLOSED' && (
          <VoidIncidentButton incidentId={incident.id} />
        )}
      </div>

      {incident.status === 'SUBMITTED' && !incident.investigation && can(session.user.role, 'investigation', 'create') && (
        <StartInvestigationForm incidentId={incident.id} users={users.map((u) => ({ id: u.id, name: u.worker.name }))} />
      )}

      {incident.investigation && (
        <div className="prisma-card p-4">
          <h2 className="mb-2 text-sm font-semibold">Investigasi</h2>
          <p className="text-sm">
            Status: <StatusBadge status={incident.investigation.status} /> — Metode: {incident.investigation.method}
          </p>
          <Link href={`/investigations/${incident.investigation.id}`} className="mt-2 inline-block text-sm text-mineral hover:underline">
            Buka ruang kerja investigasi →
          </Link>
        </div>
      )}

      {incident.capas.length > 0 && (
        <div className="prisma-card p-4">
          <h2 className="mb-2 text-sm font-semibold">CAPA Terkait</h2>
          <ul className="space-y-1 text-sm">
            {incident.capas.map((c) => (
              <li key={c.id} className="flex items-center justify-between">
                <Link href={`/capa/${c.id}`} className="text-mineral hover:underline">{c.humanNo}</Link>
                <StatusBadge status={c.status} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-graphite/50">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
