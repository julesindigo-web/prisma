'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  addScatEntryAction,
  moveToReportDraftAction,
  submitForHseReviewAction,
  finalizeInvestigationAction,
  setRootCauseAction
} from '@/app/actions/investigations';

const PHASES = ['immediate_cause', 'basic_personal', 'basic_job', 'lack_control'];

export function AddScatEntryForm({ investigationId }: { investigationId: string }) {
  const [phase, setPhase] = useState(PHASES[0]);
  const [code, setCode] = useState('');
  const [label, setLabel] = useState('');
  const [note, setNote] = useState('');
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="prisma-card space-y-2 p-4">
      <h3 className="text-sm font-semibold">Tambah Entri SCAT</h3>
      <div className="grid grid-cols-2 gap-2">
        <select className="field-input" value={phase} onChange={(e) => setPhase(e.target.value)}>
          {PHASES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <input className="field-input" placeholder="Kode (mis. 7.3.2)" value={code} onChange={(e) => setCode(e.target.value)} />
      </div>
      <input className="field-input" placeholder="Label" value={label} onChange={(e) => setLabel(e.target.value)} />
      <textarea className="field-input" placeholder="Catatan bukti (wajib)" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
      <button
        className="btn-secondary text-xs"
        disabled={pending || !code || !note}
        onClick={() =>
          startTransition(async () => {
            await addScatEntryAction(investigationId, phase, code, label, note);
            setCode(''); setLabel(''); setNote('');
            router.refresh();
          })
        }
      >
        {pending ? 'Menyimpan…' : 'Tambah entri'}
      </button>
    </div>
  );
}

export function RootCauseForm({ investigationId, initialRootCause, initialFindings }: { investigationId: string; initialRootCause: string; initialFindings: string }) {
  const [rootCause, setRootCause] = useState(initialRootCause);
  const [findings, setFindings] = useState(initialFindings);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="prisma-card space-y-2 p-4">
      <h3 className="text-sm font-semibold">Akar Masalah &amp; Temuan</h3>
      <textarea className="field-input" placeholder="Akar masalah" value={rootCause} onChange={(e) => setRootCause(e.target.value)} rows={2} />
      <textarea className="field-input" placeholder="Temuan &amp; rekomendasi" value={findings} onChange={(e) => setFindings(e.target.value)} rows={3} />
      <button
        className="btn-secondary text-xs"
        disabled={pending}
        onClick={() => startTransition(async () => { await setRootCauseAction(investigationId, rootCause, findings); router.refresh(); })}
      >
        {pending ? 'Menyimpan…' : 'Simpan'}
      </button>
    </div>
  );
}

export function InvestigationStageActions({ investigationId, status }: { investigationId: string; status: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    'Kronologi konsisten dengan bukti': false,
    'Catatan bukti tiap kode SCAT': false,
    'Akar masalah minimal level-3': false,
    'Rekomendasi SMART + hierarki kontrol': false,
    'Klasifikasi konsisten': false
  });
  const [otp, setOtp] = useState('');
  const router = useRouter();

  function run(fn: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await fn();
        router.refresh();
      } catch (e: any) {
        setError(e?.message ?? 'Terjadi kesalahan.');
      }
    });
  }

  return (
    <div className="prisma-card space-y-3 p-4">
      <h3 className="text-sm font-semibold">Tahapan Investigasi</h3>
      {error && <p className="field-error">{error}</p>}

      {status === 'OPEN' && (
        <button className="btn-primary text-xs" disabled={pending} onClick={() => run(() => moveToReportDraftAction(investigationId))}>
          Lanjut ke Draf Laporan
        </button>
      )}

      {status === 'REPORT_DRAFT' && (
        <div className="space-y-2">
          {Object.keys(checklist).map((k) => (
            <label key={k} className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={checklist[k]} onChange={(e) => setChecklist((c) => ({ ...c, [k]: e.target.checked }))} />
              {k}
            </label>
          ))}
          <button
            className="btn-primary text-xs"
            disabled={pending}
            onClick={() => run(() => submitForHseReviewAction(investigationId, checklist))}
          >
            Ajukan Review HSE
          </button>
        </div>
      )}

      {status === 'HSE_REVIEW' && (
        <div className="space-y-2">
          <label className="field-label">Konfirmasi OTP pengesahan PJO (simulasi)</label>
          <input className="field-input" placeholder="Masukkan kode OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
          <button
            className="btn-primary text-xs"
            disabled={pending || otp.length < 4}
            onClick={() => run(() => finalizeInvestigationAction(investigationId, true))}
          >
            Sahkan Final
          </button>
        </div>
      )}

      {status === 'FINAL' && <p className="text-xs text-graphite/50">Laporan telah Final dan bersifat immutable. Perubahan hanya melalui Amendment.</p>}
    </div>
  );
}
