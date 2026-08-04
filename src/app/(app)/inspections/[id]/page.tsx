import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { StatusBadge } from '@/components/status-badge';
import { InspectionChecklistForm, CloseInspectionButton } from '@/components/inspection-actions';

export default async function InspectionDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const record = await db.inspectionRecord.findUnique({
    where: { id: params.id },
    include: { template: true, site: true, equipment: true, items: true }
  });
  if (!record) notFound();

  const templateItems = (record.template.items as any[]) ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <h1 className="text-xl font-semibold">{record.humanNo}</h1>
            <StatusBadge status={record.status} />
          </div>
          <p className="text-sm text-graphite/60">{record.template.name} — {record.site.name}{record.equipment ? ` / ${record.equipment.unitCode}` : ''}</p>
        </div>
        <Link href="/inspections" className="btn-secondary text-xs">Kembali</Link>
      </div>

      {record.status === 'SCHEDULED' && <InspectionChecklistForm recordId={record.id} templateItems={templateItems} />}

      {record.items.length > 0 && (
        <div className="prisma-card p-4">
          <h2 className="mb-2 text-sm font-semibold">Hasil</h2>
          <table className="w-full text-left text-xs">
            <thead className="text-graphite/50"><tr><th className="py-1">Item</th><th>Hasil</th><th>Catatan</th></tr></thead>
            <tbody>
              {record.items.map((i) => (
                <tr key={i.id} className="border-t border-graphite/5">
                  <td className="py-1">{i.itemCode}</td>
                  <td><span className={`badge ${i.result === 'DEFECT' ? 'badge-signal' : 'badge-mineral'}`}>{i.result}</span></td>
                  <td>{i.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {record.followupRef && <p className="mt-2 text-xs text-graphite/60">Tindak lanjut otomatis: CAPA {record.followupRef}</p>}
        </div>
      )}

      {(record.status === 'DONE' || record.status === 'FOLLOW_UP') && <CloseInspectionButton recordId={record.id} />}
    </div>
  );
}
