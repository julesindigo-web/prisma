import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateMonthlyReportAction, sendRegReportAction } from '@/app/actions/regulatory';

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default async function RegulatoryCenterPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const [rclConstants, reports, clients] = await Promise.all([
    db.rclConstant.findMany({ orderBy: { key: 'asc' } }),
    db.regReport.findMany({ include: { client: true }, orderBy: { createdAt: 'desc' }, take: 30 }),
    db.client.findMany({ where: { active: true } })
  ]);

  async function generateAction(formData: FormData) {
    'use server';
    await generateMonthlyReportAction(String(formData.get('clientId')), String(formData.get('period')));
  }
  async function sendAction(formData: FormData) {
    'use server';
    await sendRegReportAction(String(formData.get('reportId')), String(formData.get('channel')), String(formData.get('recipient')), String(formData.get('receiptRef')));
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Pusat Regulasi</h1>

      <div className="prisma-card p-4">
        <h2 className="mb-3 text-sm font-semibold">Regulation Change Library (RCL)</h2>
        <table className="w-full text-left text-xs">
          <thead className="text-graphite/50"><tr><th className="py-1 pr-4">Kunci</th><th className="pr-4">Nilai</th><th className="pr-4">Kutipan</th><th>Status</th></tr></thead>
          <tbody>
            {rclConstants.map((r) => (
              <tr key={r.id} className="border-t border-graphite/5">
                <td className="py-1 pr-4 font-mono">{r.key}</td>
                <td className="pr-4">{r.value}</td>
                <td className="pr-4 max-w-xs truncate" title={r.citation}>{r.citation}</td>
                <td><span className={`badge ${r.status === 'VERIFIED' ? 'badge-mineral' : 'badge-signal'}`}>{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="prisma-card p-4">
        <h2 className="mb-3 text-sm font-semibold">Buat Laporan Bulanan (Kepmen ESDM 1806 K/2018)</h2>
        <form action={generateAction} className="flex flex-wrap gap-2">
          <select name="clientId" required className="field-input max-w-xs">
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input name="period" defaultValue={currentPeriod()} required className="field-input max-w-[140px]" placeholder="YYYY-MM" />
          <button className="btn-primary">Buat Laporan</button>
        </form>
      </div>

      <div className="prisma-card p-4">
        <h2 className="mb-3 text-sm font-semibold">Register Laporan</h2>
        <table className="w-full text-left text-xs">
          <thead className="text-graphite/50"><tr><th className="py-1 pr-4">Jenis</th><th className="pr-4">Client</th><th className="pr-4">Periode</th><th className="pr-4">Status</th><th>Aksi</th></tr></thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id} className="border-t border-graphite/5">
                <td className="py-1 pr-4">{r.kind}</td>
                <td className="pr-4">{r.client?.name ?? '—'}</td>
                <td className="pr-4">{r.period}</td>
                <td className="pr-4"><span className={`badge ${r.status === 'SENT' ? 'badge-mineral' : 'badge-amber'}`}>{r.status}</span></td>
                <td>
                  {r.status !== 'SENT' && (
                    <form action={sendAction} className="flex gap-1">
                      <input type="hidden" name="reportId" value={r.id} />
                      <input name="channel" placeholder="Saluran" className="field-input !py-1 !text-xs" defaultValue="EMAIL" />
                      <input name="recipient" placeholder="Penerima" className="field-input !py-1 !text-xs" defaultValue="Disnaker" />
                      <input name="receiptRef" placeholder="No. bukti" className="field-input !py-1 !text-xs" required />
                      <button className="btn-secondary !py-1 text-xs">Kirim</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {reports.length === 0 && <tr><td colSpan={5} className="py-3 text-center text-graphite/40">Belum ada laporan.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
