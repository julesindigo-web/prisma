import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { createProactiveReportAction } from '@/app/actions/proactive';

const CATEGORIES = ['UNSAFE_ACT', 'UNSAFE_CONDITION', 'NEAR_MISS_OBSERVATION', 'SARAN_PERBAIKAN', 'LAIN'];

export default async function NewProactivePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const sites = await db.site.findMany({ where: { active: true } });

  async function action(formData: FormData) {
    'use server';
    await createProactiveReportAction(formData);
    redirect('/proactive');
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-4 text-xl font-semibold">Laporan Proaktif</h1>
      <form action={action} className="prisma-card space-y-4 p-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="anonymous" />
          Laporkan secara anonim
        </label>
        <div>
          <label className="field-label">Site</label>
          <select name="siteId" required className="field-input">
            {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label">Kategori</label>
          <select name="category" required className="field-input">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label">Deskripsi</label>
          <textarea name="desc" required className="field-input" rows={4} />
        </div>
        <div>
          <label className="field-label">Saran perbaikan (opsional)</label>
          <textarea name="suggestion" className="field-input" rows={2} />
        </div>
        <div>
          <label className="field-label">Kontak tersegel (opsional, hanya untuk laporan anonim)</label>
          <input name="sealedContact" className="field-input" placeholder="Nomor WA/email — hanya terlihat oleh System Owner" />
        </div>
        <button type="submit" className="btn-primary w-full">Kirim Laporan</button>
      </form>
    </div>
  );
}
