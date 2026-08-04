import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { createCapaAction } from '@/app/actions/capa';

export default async function NewCapaPage({ searchParams }: { searchParams: { incidentId?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const [workers, incidents] = await Promise.all([
    db.worker.findMany({ where: { active: true }, orderBy: { name: 'asc' } }),
    db.incident.findMany({ orderBy: { incidentDt: 'desc' }, take: 100 })
  ]);

  async function action(formData: FormData) {
    'use server';
    await createCapaAction(formData);
    redirect('/capa');
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-xl font-semibold">Buat CAPA Baru</h1>
      <form action={action} className="prisma-card space-y-4 p-6">
        <div>
          <label className="field-label">Sumber</label>
          <select name="source" className="field-input" defaultValue="INCIDENT">
            <option value="INCIDENT">Insiden</option>
            <option value="INSPECTION">Inspeksi</option>
            <option value="PROACTIVE">Laporan Proaktif</option>
            <option value="AUDIT">Audit</option>
          </select>
        </div>
        <div>
          <label className="field-label">Insiden terkait (opsional)</label>
          <select name="incidentId" className="field-input" defaultValue={searchParams.incidentId ?? ''}>
            <option value="">—</option>
            {incidents.map((i) => <option key={i.id} value={i.id}>{i.humanNo} — {i.title}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label">Tindakan</label>
          <textarea name="action" required className="field-input" rows={3} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label">Jenis pengendalian</label>
            <select name="controlType" className="field-input">
              <option value="ELIM">Eliminasi</option>
              <option value="SUB">Substitusi</option>
              <option value="ENG">Rekayasa</option>
              <option value="ADM">Administratif</option>
              <option value="APD">APD</option>
            </select>
          </div>
          <div>
            <label className="field-label">Prioritas</label>
            <select name="priority" className="field-input">
              <option value="P1">P1 (7 hari)</option>
              <option value="P2">P2 (30 hari)</option>
              <option value="P3">P3 (90 hari)</option>
            </select>
          </div>
        </div>
        <div>
          <label className="field-label">PIC</label>
          <select name="picId" required className="field-input">
            <option value="">Pilih PIC…</option>
            {workers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label">Tenggat</label>
          <input type="date" name="dueD" required className="field-input" />
        </div>
        <button type="submit" className="btn-primary w-full">Simpan CAPA</button>
      </form>
    </div>
  );
}
