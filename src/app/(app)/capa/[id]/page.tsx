import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { StatusBadge } from '@/components/status-badge';
import { CapaStageActions } from '@/components/capa-actions';

export default async function CapaDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const capa = await db.capa.findUnique({
    where: { id: params.id },
    include: { pic: true, verifier: { include: { worker: true } }, incident: true }
  });
  if (!capa) notFound();

  const verifiers = await db.userAccount.findMany({ where: { active: true, workerId: { not: capa.picId } }, include: { worker: true } });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <h1 className="text-xl font-semibold">{capa.humanNo}</h1>
            <StatusBadge status={capa.status} />
            {capa.recurrenceFlag && <span className="badge badge-signal">Rekurensi</span>}
          </div>
          <p className="text-sm text-graphite/60">{capa.action}</p>
        </div>
        <Link href="/capa" className="btn-secondary text-xs">Kembali</Link>
      </div>

      <div className="prisma-card grid grid-cols-2 gap-4 p-4 text-sm md:grid-cols-3">
        <Field label="PIC" value={capa.pic.name} />
        <Field label="Prioritas" value={capa.priority} />
        <Field label="Jenis pengendalian" value={capa.controlType} />
        <Field label="Tenggat" value={capa.dueD.toISOString().slice(0, 10)} />
        <Field label="Sumber" value={`${capa.source}${capa.sourceRef ? ` (${capa.sourceRef})` : ''}`} />
        <Field label="Verifikator" value={capa.verifier?.worker.name ?? '—'} />
        {capa.incident && <Field label="Insiden terkait" value={capa.incident.humanNo} />}
        <Field label="Jumlah dibuka kembali" value={String(capa.reopenCount)} />
      </div>

      <CapaStageActions capaId={capa.id} status={capa.status} verifiers={verifiers.map((v) => ({ id: v.id, name: v.worker.name }))} />
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
