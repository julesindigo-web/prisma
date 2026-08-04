'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { createIncidentDraft } from '@/app/actions/incidents';

type Location = { id: string; name: string; areaType: string };
type Site = { id: string; name: string; locations: Location[] };
type Client = { id: string; name: string; sites: Site[] };
type Worker = { id: string; name: string; nik: string };
type Equipment = { id: string; unitCode: string; type: string };

const REG_TYPES = [
  { value: 'KT', label: 'Kecelakaan Tambang (KT)' },
  { value: 'KB', label: 'Kejadian Berbahaya (KB)' },
  { value: 'PAK', label: 'Penyakit Akibat Kerja (PAK)' },
  { value: 'NA', label: 'Bukan kecelakaan tambang (NA)' }
];
const MGMT_CATEGORIES = [
  { value: 'INJ', label: 'Cedera (INJ)' },
  { value: 'PD', label: 'Kerusakan properti (PD)' },
  { value: 'ENV', label: 'Lingkungan (ENV)' },
  { value: 'PB', label: 'Proses bisnis (PB)' },
  { value: 'MECH', label: 'Mekanikal (MECH)' }
];
const IND_CLASSES = [
  { value: 'NM', label: 'Near Miss (NM)' },
  { value: 'FAI', label: 'First Aid Injury (FAI)' },
  { value: 'MTI', label: 'Medical Treatment Injury (MTI)' },
  { value: 'RWTC', label: 'Restricted Work Case (RWTC)' },
  { value: 'LTI', label: 'Lost Time Injury (LTI)' },
  { value: 'FAT', label: 'Fatality (FAT)' },
  { value: 'PD', label: 'Kerusakan Properti (PD)' }
];
const WEATHER = ['CERAH', 'HUJAN', 'MENDUNG', 'KABUT', 'BERANGIN', 'GELAP'];
const SHIFTS = [
  { value: 'DAY', label: 'Day (07-15)' },
  { value: 'SWING', label: 'Swing (15-23)' },
  { value: 'NIGHT', label: 'Night (23-07)' }
];
const OUTCOMES = ['RAWAT_JALAN', 'RAWAT_INAP', 'PULIH', 'CACAT_PERMANEN', 'MENINGGAL'];
const PRESERVATION_DEFAULT = [
  'Area dibatasi (barricade)',
  'Tidak ada perubahan selain untuk penyelamatan',
  'Bukti difoto sebelum perubahan',
  'Saksi dipisahkan',
  'Unit tidak dioperasikan'
];

interface Victim {
  workerId: string;
  expY: number;
  expM: number;
  lostDays: number;
  ongoing: boolean;
  outcome: string;
}

function regClassOptionsFor(regType: string): string[] {
  if (regType === 'KT') return ['RINGAN', 'BERAT', 'MENINGGAL'];
  if (regType === 'KB') return ['KB_SPEC'];
  if (regType === 'PAK') return ['PAK'];
  return ['NA'];
}

export function IncidentWizard({ clients, workers, equipment }: { clients: Client[]; workers: Worker[]; equipment: Equipment[] }) {
  const [step, setStep] = useState(1);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [clientId, setClientId] = useState('');
  const [siteId, setSiteId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [title, setTitle] = useState('');
  const [incidentDt, setIncidentDt] = useState('');
  const [shift, setShift] = useState('DAY');
  const [weather, setWeather] = useState('CERAH');

  const [regType, setRegType] = useState('NA');
  const [kbSpecCode, setKbSpecCode] = useState('');
  const [mgmtCategory, setMgmtCategory] = useState('INJ');
  const [indClass, setIndClass] = useState('NM');
  const [regClass, setRegClass] = useState('NA');
  const [potentialSev, setPotentialSev] = useState(1);

  const [victims, setVictims] = useState<Victim[]>([]);
  const [equipmentIds, setEquipmentIds] = useState<string[]>([]);

  const [description, setDescription] = useState('');
  const [workDayNo, setWorkDayNo] = useState<number | ''>('');
  const [preservation, setPreservation] = useState<Record<string, boolean>>({});
  const [gps, setGps] = useState<{ lat?: number; lng?: number; accuracy?: number }>({});

  const selectedClient = clients.find((c) => c.id === clientId);
  const selectedSite = selectedClient?.sites.find((s) => s.id === siteId);
  const hipo = potentialSev >= 4;

  // Draft autosave (client-only, per §10: offline queue simplified to localStorage draft persistence)
  const draftKey = 'prisma:incident-draft';
  useEffect(() => {
    const raw = localStorage.getItem(draftKey);
    if (raw) {
      try {
        const d = JSON.parse(raw);
        setClientId(d.clientId ?? '');
        setSiteId(d.siteId ?? '');
        setLocationId(d.locationId ?? '');
        setTitle(d.title ?? '');
        setIncidentDt(d.incidentDt ?? '');
        setDescription(d.description ?? '');
      } catch {
        /* ignore corrupted draft */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const draft = { clientId, siteId, locationId, title, incidentDt, description };
    localStorage.setItem(draftKey, JSON.stringify(draft));
  }, [clientId, siteId, locationId, title, incidentDt, description]);

  useEffect(() => {
    const opts = regClassOptionsFor(regType);
    if (!opts.includes(regClass)) setRegClass(opts[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regType]);

  function captureGps() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      () => setError('Gagal mengambil lokasi GPS. Isi lokasi secara manual jika diperlukan.')
    );
  }

  function addVictim() {
    setVictims((v) => [...v, { workerId: '', expY: 0, expM: 0, lostDays: 0, ongoing: false, outcome: 'PULIH' }]);
  }
  function updateVictim(idx: number, patch: Partial<Victim>) {
    setVictims((v) => v.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }
  function removeVictim(idx: number) {
    setVictims((v) => v.filter((_, i) => i !== idx));
  }

  function toggleEquipment(id: string) {
    setEquipmentIds((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));
  }

  function handleSubmit() {
    setError(null);
    setFieldErrors({});
    const fd = new FormData();
    fd.set('clientId', clientId);
    fd.set('siteId', siteId);
    fd.set('locationId', locationId);
    fd.set('title', title);
    fd.set('incidentDt', incidentDt);
    fd.set('shift', shift);
    fd.set('weather', weather);
    fd.set('regType', regType);
    fd.set('kbSpecCode', kbSpecCode);
    fd.set('mgmtCategory', mgmtCategory);
    fd.set('indClass', indClass);
    fd.set('regClass', regClass);
    fd.set('potentialSev', String(potentialSev));
    fd.set('description', description);
    fd.set('workDayNo', String(workDayNo || 0));
    fd.set('victimsJson', JSON.stringify(victims));
    fd.set('equipmentIdsJson', JSON.stringify(equipmentIds));
    if (gps.lat) fd.set('gpsLat', String(gps.lat));
    if (gps.lng) fd.set('gpsLng', String(gps.lng));
    if (gps.accuracy) fd.set('gpsAccuracy', String(gps.accuracy));

    startTransition(async () => {
      const res = await createIncidentDraft(fd);
      if (res?.error) {
        setError(res.error);
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
        return;
      }
      localStorage.removeItem(draftKey);
    });
  }

  const steps = ['Umum', 'Klasifikasi', 'Korban/Pihak', 'Detail/Bukti', 'Review'];

  return (
    <div className="prisma-card p-6">
      <ol className="mb-6 flex flex-wrap gap-2 text-xs">
        {steps.map((s, i) => (
          <li key={s} className={`badge ${step === i + 1 ? 'badge-mineral' : 'badge-graphite'}`}>
            {i + 1}. {s}
          </li>
        ))}
      </ol>

      {error && <p className="field-error mb-4">{error}</p>}

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="field-label">Client</label>
            <select className="field-input" value={clientId} onChange={(e) => { setClientId(e.target.value); setSiteId(''); setLocationId(''); }}>
              <option value="">Pilih client…</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Site</label>
            <select className="field-input" value={siteId} onChange={(e) => { setSiteId(e.target.value); setLocationId(''); }} disabled={!selectedClient}>
              <option value="">Pilih site…</option>
              {selectedClient?.sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Lokasi</label>
            <select className="field-input" value={locationId} onChange={(e) => setLocationId(e.target.value)} disabled={!selectedSite}>
              <option value="">Pilih lokasi…</option>
              {selectedSite?.locations.map((l) => <option key={l.id} value={l.id}>{l.name} ({l.areaType})</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Judul singkat</label>
            <input className="field-input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">Tanggal &amp; waktu kejadian</label>
              <input type="datetime-local" className="field-input" value={incidentDt} onChange={(e) => setIncidentDt(e.target.value)} />
              {fieldErrors.incidentDt && <p className="field-error">{fieldErrors.incidentDt}</p>}
            </div>
            <div>
              <label className="field-label">Shift</label>
              <select className="field-input" value={shift} onChange={(e) => setShift(e.target.value)}>
                {SHIFTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="field-label">Cuaca</label>
            <select className="field-input" value={weather} onChange={(e) => setWeather(e.target.value)}>
              {WEATHER.map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="field-label">Jenis regulasi (reg_type)</label>
            <select className="field-input" value={regType} onChange={(e) => setRegType(e.target.value)}>
              {REG_TYPES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          {regType === 'KB' && (
            <div>
              <label className="field-label">Kode spesifikasi Kejadian Berbahaya</label>
              <input className="field-input" value={kbSpecCode} onChange={(e) => setKbSpecCode(e.target.value)} placeholder="mis. KB-01" />
              {fieldErrors.kbSpecCode && <p className="field-error">{fieldErrors.kbSpecCode}</p>}
            </div>
          )}
          {regType === 'KT' && (
            <div>
              <label className="field-label">Klasifikasi regulasi (reg_class)</label>
              <select className="field-input" value={regClass} onChange={(e) => setRegClass(e.target.value)}>
                {regClassOptionsFor(regType).map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              {fieldErrors.regClass && <p className="field-error">{fieldErrors.regClass}</p>}
            </div>
          )}
          <div>
            <label className="field-label">Kategori manajemen</label>
            <select className="field-input" value={mgmtCategory} onChange={(e) => setMgmtCategory(e.target.value)}>
              {MGMT_CATEGORIES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Klasifikasi internal (ind_class)</label>
            <select className="field-input" value={indClass} onChange={(e) => setIndClass(e.target.value)}>
              {IND_CLASSES.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
            </select>
            {fieldErrors.victims && <p className="field-error">{fieldErrors.victims}</p>}
          </div>
          <div>
            <label className="field-label">Potensi keparahan (1-5)</label>
            <input type="range" min={1} max={5} value={potentialSev} onChange={(e) => setPotentialSev(Number(e.target.value))} className="w-full" />
            <div className="flex items-center justify-between text-xs text-graphite/60">
              <span>1 (rendah)</span><span>5 (fatal/massal)</span>
            </div>
            {hipo && <span className="badge badge-signal mt-2 inline-block">HIPO — Potensi Keparahan Tinggi</span>}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Korban</h3>
              <button type="button" onClick={addVictim} className="btn-secondary text-xs">+ Tambah korban</button>
            </div>
            {victims.length === 0 && <p className="text-xs text-graphite/50">Belum ada korban ditambahkan (wajib kosong untuk Near Miss).</p>}
            <div className="space-y-3">
              {victims.map((v, idx) => (
                <div key={idx} className="rounded-prisma border border-graphite/10 p-3">
                  <div className="mb-2 grid grid-cols-2 gap-2">
                    <select className="field-input" value={v.workerId} onChange={(e) => updateVictim(idx, { workerId: e.target.value })}>
                      <option value="">Pilih pekerja…</option>
                      {workers.map((w) => <option key={w.id} value={w.id}>{w.name} ({w.nik})</option>)}
                    </select>
                    <select className="field-input" value={v.outcome} onChange={(e) => updateVictim(idx, { outcome: e.target.value })}>
                      {OUTCOMES.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="field-label">Th. pengalaman</label>
                      <input type="number" min={0} className="field-input" value={v.expY} onChange={(e) => updateVictim(idx, { expY: Number(e.target.value) })} />
                    </div>
                    <div>
                      <label className="field-label">Bln pengalaman</label>
                      <input type="number" min={0} max={11} className="field-input" value={v.expM} onChange={(e) => updateVictim(idx, { expM: Number(e.target.value) })} />
                    </div>
                    <div>
                      <label className="field-label">Hari hilang</label>
                      <input type="number" min={0} className="field-input" value={v.lostDays} onChange={(e) => updateVictim(idx, { lostDays: Number(e.target.value) })} />
                    </div>
                    <div className="flex items-end pb-2">
                      <label className="flex items-center gap-1 text-xs">
                        <input type="checkbox" checked={v.ongoing} onChange={(e) => updateVictim(idx, { ongoing: e.target.checked })} />
                        Masih berlangsung
                      </label>
                    </div>
                  </div>
                  <button type="button" onClick={() => removeVictim(idx)} className="mt-2 text-xs text-signal">Hapus korban</button>
                </div>
              ))}
            </div>
          </div>

          {mgmtCategory === 'PD' && (
            <div>
              <h3 className="mb-2 text-sm font-semibold">Peralatan/unit terlibat</h3>
              <div className="flex flex-wrap gap-2">
                {equipment.map((eq) => (
                  <label key={eq.id} className={`badge cursor-pointer ${equipmentIds.includes(eq.id) ? 'badge-mineral' : 'badge-graphite'}`}>
                    <input type="checkbox" className="mr-1" checked={equipmentIds.includes(eq.id)} onChange={() => toggleEquipment(eq.id)} />
                    {eq.unitCode} ({eq.type})
                  </label>
                ))}
              </div>
              {fieldErrors.equipmentIds && <p className="field-error">{fieldErrors.equipmentIds}</p>}
            </div>
          )}
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <div>
            <label className="field-label">Kronologi kejadian (min. 50 karakter)</label>
            <textarea className="field-input" rows={6} value={description} onChange={(e) => setDescription(e.target.value)} />
            {fieldErrors.description && <p className="field-error">{fieldErrors.description}</p>}
          </div>
          <div>
            <label className="field-label">Hari kerja ke- (opsional)</label>
            <input type="number" min={0} className="field-input" value={workDayNo} onChange={(e) => setWorkDayNo(e.target.value ? Number(e.target.value) : '')} />
          </div>
          <div>
            <h3 className="field-label">Checklist preservasi TKP</h3>
            <div className="space-y-1">
              {PRESERVATION_DEFAULT.map((p) => (
                <label key={p} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!preservation[p]} onChange={(e) => setPreservation((s) => ({ ...s, [p]: e.target.checked }))} />
                  {p}
                </label>
              ))}
            </div>
          </div>
          <div>
            <button type="button" onClick={captureGps} className="btn-secondary text-xs">Ambil lokasi GPS</button>
            {gps.lat && <p className="field-hint">Lokasi: {gps.lat.toFixed(5)}, {gps.lng?.toFixed(5)} (akurasi {gps.accuracy?.toFixed(0)}m){gps.accuracy && gps.accuracy > 50 ? ' — akurasi rendah (V-28)' : ''}</p>}
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-3 text-sm">
          <h3 className="font-semibold">Ringkasan</h3>
          <dl className="grid grid-cols-2 gap-2 text-xs">
            <dt className="text-graphite/50">Judul</dt><dd>{title || '—'}</dd>
            <dt className="text-graphite/50">Waktu kejadian</dt><dd>{incidentDt || '—'}</dd>
            <dt className="text-graphite/50">reg_type / reg_class</dt><dd>{regType} / {regClass}</dd>
            <dt className="text-graphite/50">ind_class</dt><dd>{indClass}</dd>
            <dt className="text-graphite/50">Potensi keparahan</dt><dd>{potentialSev} {hipo && '(HIPO)'}</dd>
            <dt className="text-graphite/50">Jumlah korban</dt><dd>{victims.length}</dd>
          </dl>
          <p className="field-hint">Insiden akan tersimpan sebagai Draft. Anda dapat mengirim (Submit) dari halaman detail setelah meninjau ulang.</p>
        </div>
      )}

      <div className="mt-6 flex justify-between border-t border-graphite/10 pt-4">
        <button type="button" className="btn-secondary" disabled={step === 1} onClick={() => setStep((s) => s - 1)}>Kembali</button>
        {step < 5 ? (
          <button type="button" className="btn-primary" onClick={() => setStep((s) => s + 1)}>Lanjut</button>
        ) : (
          <button type="button" className="btn-primary" disabled={pending} onClick={handleSubmit}>
            {pending ? 'Menyimpan…' : 'Simpan sebagai Draft'}
          </button>
        )}
      </div>
    </div>
  );
}
