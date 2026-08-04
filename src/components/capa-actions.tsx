'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { startCapaAction, submitCapaForVerificationAction, closeCapaAction } from '@/app/actions/capa';

export function CapaStageActions({ capaId, status, verifiers }: { capaId: string; status: string; verifiers: { id: string; name: string }[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [evidenceNote, setEvidenceNote] = useState('');
  const [verifierId, setVerifierId] = useState('');
  const [verifyResult, setVerifyResult] = useState<'EFEKTIF' | 'TIDAK_EFEKTIF'>('EFEKTIF');
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
      <h3 className="text-sm font-semibold">Tindakan</h3>
      {error && <p className="field-error">{error}</p>}

      {(status === 'OPEN' || status === 'REOPENED') && (
        <button className="btn-primary text-xs" disabled={pending} onClick={() => run(() => startCapaAction(capaId))}>
          Mulai Pengerjaan
        </button>
      )}

      {status === 'IN_PROGRESS' && (
        <div className="space-y-2">
          <textarea className="field-input" placeholder="Catatan bukti penyelesaian" value={evidenceNote} onChange={(e) => setEvidenceNote(e.target.value)} rows={2} />
          <button className="btn-primary text-xs" disabled={pending || !evidenceNote} onClick={() => run(() => submitCapaForVerificationAction(capaId, evidenceNote))}>
            Ajukan Verifikasi
          </button>
        </div>
      )}

      {status === 'AWAITING_VERIFICATION' && (
        <div className="space-y-2">
          <select className="field-input" value={verifierId} onChange={(e) => setVerifierId(e.target.value)}>
            <option value="">Pilih verifikator…</option>
            {verifiers.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          <select className="field-input" value={verifyResult} onChange={(e) => setVerifyResult(e.target.value as any)}>
            <option value="EFEKTIF">Efektif</option>
            <option value="TIDAK_EFEKTIF">Tidak Efektif (buka kembali)</option>
          </select>
          <button className="btn-primary text-xs" disabled={pending || !verifierId} onClick={() => run(() => closeCapaAction(capaId, verifierId, verifyResult))}>
            Verifikasi &amp; Tutup
          </button>
        </div>
      )}

      {status === 'CLOSED' && <p className="text-xs text-graphite/50">CAPA telah ditutup dan diverifikasi efektif.</p>}
    </div>
  );
}
