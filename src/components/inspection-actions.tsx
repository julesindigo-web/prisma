'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { completeInspectionAction, closeInspectionAction, type InspectionItemInput } from '@/app/actions/inspections';

type TemplateItem = { code: string; question: string; critical?: boolean };

export function InspectionChecklistForm({ recordId, templateItems }: { recordId: string; templateItems: TemplateItem[] }) {
  const [results, setResults] = useState<Record<string, InspectionItemInput>>(
    Object.fromEntries(templateItems.map((t) => [t.code, { itemCode: t.code, result: 'OK' as const, note: '', photo: '' }]))
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function update(code: string, patch: Partial<InspectionItemInput>) {
    setResults((r) => ({ ...r, [code]: { ...r[code], ...patch } }));
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        await completeInspectionAction(recordId, Object.values(results));
        router.refresh();
      } catch (e: any) {
        setError(e?.message ?? 'Gagal menyimpan hasil inspeksi.');
      }
    });
  }

  return (
    <div className="prisma-card space-y-4 p-4">
      <h3 className="text-sm font-semibold">Checklist</h3>
      {error && <p className="field-error">{error}</p>}
      <div className="space-y-3">
        {templateItems.map((t) => (
          <div key={t.code} className="rounded-prisma border border-graphite/10 p-3">
            <p className="mb-2 text-sm">{t.code} — {t.question} {t.critical && <span className="badge badge-signal ml-1">Kritis</span>}</p>
            <div className="flex flex-wrap gap-3">
              {(['OK', 'DEFECT', 'NA'] as const).map((r) => (
                <label key={r} className="flex items-center gap-1 text-xs">
                  <input type="radio" name={`result-${t.code}`} checked={results[t.code]?.result === r} onChange={() => update(t.code, { result: r })} />
                  {r}
                </label>
              ))}
            </div>
            {results[t.code]?.result === 'DEFECT' && (
              <div className="mt-2 space-y-2">
                <textarea className="field-input" placeholder="Catatan defect" value={results[t.code]?.note} onChange={(e) => update(t.code, { note: e.target.value })} rows={2} />
                <input className="field-input" placeholder="Referensi foto (nama file / URL) — wajib untuk defect" value={results[t.code]?.photo} onChange={(e) => update(t.code, { photo: e.target.value })} />
              </div>
            )}
          </div>
        ))}
      </div>
      <button className="btn-primary" disabled={pending} onClick={submit}>{pending ? 'Menyimpan…' : 'Selesaikan Inspeksi'}</button>
    </div>
  );
}

export function CloseInspectionButton({ recordId }: { recordId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <button className="btn-secondary" disabled={pending} onClick={() => startTransition(async () => { await closeInspectionAction(recordId); router.refresh(); })}>
      {pending ? 'Memproses…' : 'Tutup Inspeksi'}
    </button>
  );
}
