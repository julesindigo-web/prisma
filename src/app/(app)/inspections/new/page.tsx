import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { scheduleInspectionAction } from '@/app/actions/inspections';

export default async function NewInspectionPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const [templates, sites, equipment] = await Promise.all([
    db.inspectionTemplate.findMany({ where: { active: true } }),
    db.site.findMany({ where: { active: true } }),
    db.equipment.findMany()
  ]);

  async function action(formData: FormData) {
    'use server';
    await scheduleInspectionAction(formData);
    redirect('/inspections');
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-4 text-xl font-semibold">Jadwalkan Inspeksi</h1>
      <form action={action} className="prisma-card space-y-4 p-6">
        <div>
          <label className="field-label">Template</label>
          <select name="templateId" required className="field-input">
            {templates.map((t) => <option key={t.id} value={t.id}>{t.name} (v{t.version})</option>)}
          </select>
        </div>
        <div>
          <label className="field-label">Site</label>
          <select name="siteId" required className="field-input">
            {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label">Unit/peralatan (opsional)</label>
          <select name="equipmentId" className="field-input">
            <option value="">—</option>
            {equipment.map((e) => <option key={e.id} value={e.id}>{e.unitCode}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label">Tanggal</label>
          <input type="datetime-local" name="dt" required className="field-input" />
        </div>
        <button type="submit" className="btn-primary w-full">Jadwalkan</button>
      </form>
    </div>
  );
}
