import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { StatusBadge } from '@/components/status-badge';
import { AddScatEntryForm, RootCauseForm, InvestigationStageActions } from '@/components/investigation-actions';

export default async function InvestigationPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const investigation = await db.investigation.findUnique({
    where: { id: params.id },
    include: { incident: true, lead: { include: { worker: true } }, scatEntries: true }
  });
  if (!investigation) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <h1 className="text-xl font-semibold">Investigasi — {investigation.incident.humanNo}</h1>
            <StatusBadge status={investigation.status} />
          </div>
          <p className="text-sm text-graphite/60">Metode: {investigation.method} — Ketua: {investigation.lead.worker.name}</p>
        </div>
        <Link href={`/incidents/${investigation.incidentId}`} className="btn-secondary text-xs">Kembali ke insiden</Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-4 md:col-span-2">
          <div className="prisma-card p-4">
            <h2 className="mb-2 text-sm font-semibold">Entri SCAT ({investigation.scatEntries.length})</h2>
            <table className="w-full text-left text-xs">
              <thead className="text-graphite/50"><tr><th className="py-1">Fase</th><th>Kode</th><th>Label</th><th>Catatan</th></tr></thead>
              <tbody>
                {investigation.scatEntries.map((s) => (
                  <tr key={s.id} className="border-t border-graphite/5">
                    <td className="py-1">{s.phase}</td><td>{s.code}</td><td>{s.label}</td><td>{s.note}</td>
                  </tr>
                ))}
                {investigation.scatEntries.length === 0 && (
                  <tr><td colSpan={4} className="py-3 text-center text-graphite/40">Belum ada entri SCAT.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {investigation.status === 'OPEN' && <AddScatEntryForm investigationId={investigation.id} />}
          {(investigation.status === 'OPEN' || investigation.status === 'REPORT_DRAFT') && (
            <RootCauseForm
              investigationId={investigation.id}
              initialRootCause={investigation.rootCause ?? ''}
              initialFindings={investigation.findings ?? ''}
            />
          )}
        </div>

        <div>
          <InvestigationStageActions investigationId={investigation.id} status={investigation.status} />
        </div>
      </div>
    </div>
  );
}
