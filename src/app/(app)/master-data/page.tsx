import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { can } from '@/lib/rbac';
import {
  createClientAction,
  createSiteAction,
  createLocationAction,
  createWorkerAction,
  createEquipmentAction,
  createUserAccountAction,
  updateClientAction,
  updateSiteAction,
  updateLocationAction,
  updateWorkerAction,
  updateEquipmentAction,
  deleteClientAction,
  deleteSiteAction,
  deleteLocationAction,
  deleteWorkerAction,
  deleteEquipmentAction
} from '@/app/actions/master';
import MasterDataTable from '@/components/master-data-table';

export default async function MasterDataPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const [clients, sites, locations, workers, equipment] = await Promise.all([
    db.client.findMany({ orderBy: { name: 'asc' } }),
    db.site.findMany({ include: { client: true }, orderBy: { name: 'asc' } }),
    db.location.findMany({ include: { site: true }, orderBy: { name: 'asc' } }),
    db.worker.findMany({ orderBy: { name: 'asc' } }),
    db.equipment.findMany({ orderBy: { unitCode: 'asc' } })
  ]);

  const canAdmin = can(session.user.role, 'master', 'admin');

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold">Master Data</h1>

      <Section title={`Client (${clients.length})`}>
        {canAdmin ? (
          <MasterDataTable
            columns={[
              { key: 'code', label: 'Kode' },
              { key: 'name', label: 'Nama' },
              { key: 'iupNo', label: 'No. IUP', placeholder: 'Kosongkan jika belum ada' },
              { key: 'kttName', label: 'KTT/PJO', placeholder: 'Nama KTT atau PJO' }
            ]}
            rows={clients}
            action={updateClientAction}
            deleteAction={deleteClientAction}
          />
        ) : (
          <ReadOnlyTable headers={['Kode', 'Nama', 'No. IUP', 'KTT/PJO']} rows={clients.map((c) => [c.code, c.name, c.iupNo ?? '—', c.kttName ?? '—'])} />
        )}
        {canAdmin && (
          <form action={createClientAction} className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
            <input name="code" placeholder="Kode" required className="field-input" />
            <input name="name" placeholder="Nama" required className="field-input" />
            <input name="iupNo" placeholder="No. IUP" className="field-input" />
            <input name="kttName" placeholder="KTT/PJO" className="field-input" />
            <button className="btn-secondary col-span-2 md:col-span-4">+ Tambah Client</button>
          </form>
        )}
      </Section>

      <Section title={`Site (${sites.length})`}>
        {canAdmin ? (
          <MasterDataTable
            columns={[
              { key: 'clientName', label: 'Client' },
              { key: 'code', label: 'Kode' },
              { key: 'name', label: 'Nama' },
              { key: 'tz', label: 'Zona Waktu' }
            ]}
            rows={sites.map((s) => ({ ...s, clientName: s.client.name }))}
            action={updateSiteAction}
            deleteAction={deleteSiteAction}
          />
        ) : (
          <ReadOnlyTable headers={['Client', 'Kode', 'Nama', 'Zona Waktu']} rows={sites.map((s) => [s.client.name, s.code, s.name, s.tz])} />
        )}
        {canAdmin && (
          <form action={createSiteAction} className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
            <select name="clientId" required className="field-input">
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input name="code" placeholder="Kode" required className="field-input" />
            <input name="name" placeholder="Nama site" required className="field-input" />
            <input name="tz" placeholder="Asia/Jakarta" className="field-input" />
            <button className="btn-secondary col-span-2 md:col-span-4">+ Tambah Site</button>
          </form>
        )}
      </Section>

      <Section title={`Lokasi (${locations.length})`}>
        {canAdmin ? (
          <MasterDataTable
            columns={[
              { key: 'siteName', label: 'Site' },
              { key: 'name', label: 'Nama' },
              { key: 'areaType', label: 'Tipe Area', type: 'select', options: ['WORKSHOP', 'HAULROAD', 'PARKIR', 'FRONT', 'PLANT', 'GUDANG', 'OFFICE', 'LAIN'] }
            ]}
            rows={locations.map((l) => ({ ...l, siteName: l.site.name }))}
            action={updateLocationAction}
            deleteAction={deleteLocationAction}
          />
        ) : (
          <ReadOnlyTable headers={['Site', 'Nama', 'Tipe Area']} rows={locations.map((l) => [l.site.name, l.name, l.areaType])} />
        )}
        {canAdmin && (
          <form action={createLocationAction} className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
            <select name="siteId" required className="field-input">
              {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input name="name" placeholder="Nama lokasi" required className="field-input" />
            <select name="areaType" className="field-input">
              {['WORKSHOP', 'HAULROAD', 'PARKIR', 'FRONT', 'PLANT', 'GUDANG', 'OFFICE', 'LAIN'].map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <button className="btn-secondary col-span-2 md:col-span-4">+ Tambah Lokasi</button>
          </form>
        )}
      </Section>

      <Section title={`Pekerja (${workers.length})`}>
        {canAdmin ? (
          <MasterDataTable
            columns={[
              { key: 'nik', label: 'NIK' },
              { key: 'name', label: 'Nama' },
              { key: 'dept', label: 'Departemen', placeholder: 'Opsional' },
              { key: 'position', label: 'Jabatan', placeholder: 'Opsional' },
              { key: 'empStatus', label: 'Status', type: 'select', options: ['TETAP', 'KONTRAK', 'HARIAN', 'MAGANG'] }
            ]}
            rows={workers.slice(0, 50)}
            action={updateWorkerAction}
            deleteAction={deleteWorkerAction}
          />
        ) : (
          <ReadOnlyTable headers={['NIK', 'Nama', 'Departemen', 'Status']} rows={workers.slice(0, 20).map((w) => [w.nik, w.name, w.dept ?? '—', w.empStatus])} />
        )}
        {canAdmin && (
          <form action={createWorkerAction} className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-5">
            <input name="nik" placeholder="NIK" required className="field-input" />
            <input name="name" placeholder="Nama" required className="field-input" />
            <input name="dept" placeholder="Departemen" className="field-input" />
            <input name="position" placeholder="Jabatan" className="field-input" />
            <select name="empStatus" className="field-input">
              {['TETAP', 'KONTRAK', 'HARIAN', 'MAGANG'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="btn-secondary col-span-2 md:col-span-5">+ Tambah Pekerja</button>
          </form>
        )}
      </Section>

      <Section title={`Peralatan (${equipment.length})`}>
        {canAdmin ? (
          <MasterDataTable
            columns={[
              { key: 'unitCode', label: 'Unit' },
              { key: 'type', label: 'Tipe' },
              { key: 'make', label: 'Merek', placeholder: 'Opsional' },
              { key: 'model', label: 'Model', placeholder: 'Opsional' }
            ]}
            rows={equipment}
            action={updateEquipmentAction}
            deleteAction={deleteEquipmentAction}
          />
        ) : (
          <ReadOnlyTable headers={['Unit', 'Tipe', 'Merek', 'Model']} rows={equipment.map((e) => [e.unitCode, e.type, e.make ?? '—', e.model ?? '—'])} />
        )}
        {canAdmin && (
          <form action={createEquipmentAction} className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
            <input name="unitCode" placeholder="Kode unit" required className="field-input" />
            <input name="type" placeholder="Tipe" required className="field-input" />
            <input name="make" placeholder="Merek" className="field-input" />
            <input name="model" placeholder="Model" className="field-input" />
            <button className="btn-secondary col-span-2 md:col-span-4">+ Tambah Peralatan</button>
          </form>
        )}
      </Section>

      {canAdmin && (
        <Section title="Akun Pengguna">
          <form action={createUserAccountAction} className="grid grid-cols-2 gap-2 md:grid-cols-5">
            <select name="workerId" required className="field-input">
              {workers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
            <input name="email" type="email" placeholder="Email" required className="field-input" />
            <input name="password" type="password" placeholder="Kata sandi awal" required className="field-input" />
            <select name="role" className="field-input">
              {['PEKERJA', 'PENGAWAS', 'HSE', 'PJO', 'MGMT', 'SO', 'AUD'].map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <button className="btn-secondary">+ Tambah Akun</button>
          </form>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="prisma-card p-4">
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function ReadOnlyTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="text-graphite/50"><tr>{headers.map((h) => <th key={h} className="py-1 pr-4">{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-graphite/5">{row.map((cell, j) => <td key={j} className="py-1 pr-4">{cell}</td>)}</tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={headers.length} className="py-3 text-center text-graphite/40">Tidak ada data.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
