'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { submitIncidentAction, voidIncidentAction } from '@/app/actions/incidents';
import { startInvestigationAction } from '@/app/actions/investigations';

export function SubmitIncidentButton({ incidentId }: { incidentId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div>
      <button
        className="btn-primary"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            try {
              await submitIncidentAction(incidentId);
              router.refresh();
            } catch (e: any) {
              setError(e?.message ?? 'Gagal mengirim insiden.');
            }
          })
        }
      >
        {pending ? 'Mengirim…' : 'Submit Insiden'}
      </button>
      {error && <p className="field-error mt-1">{error}</p>}
    </div>
  );
}

export function VoidIncidentButton({ incidentId }: { incidentId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [approved, setApproved] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (!open) {
    return <button className="btn-danger" onClick={() => setOpen(true)}>Void</button>;
  }

  return (
    <div className="prisma-card space-y-2 p-3">
      <label className="field-label">Alasan pembatalan</label>
      <textarea className="field-input" value={reason} onChange={(e) => setReason(e.target.value)} rows={2} />
      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={approved} onChange={(e) => setApproved(e.target.checked)} />
        PJO telah menyetujui pembatalan ini
      </label>
      {error && <p className="field-error">{error}</p>}
      <div className="flex gap-2">
        <button className="btn-secondary text-xs" onClick={() => setOpen(false)}>Batal</button>
        <button
          className="btn-danger text-xs"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              try {
                await voidIncidentAction(incidentId, reason, approved);
                router.refresh();
                setOpen(false);
              } catch (e: any) {
                setError(e?.message ?? 'Gagal membatalkan insiden.');
              }
            })
          }
        >
          {pending ? 'Memproses…' : 'Konfirmasi Void'}
        </button>
      </div>
    </div>
  );
}

export function StartInvestigationForm({ incidentId, users }: { incidentId: string; users: { id: string; name: string }[] }) {
  const [leadId, setLeadId] = useState('');
  const [members, setMembers] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function toggleMember(id: string) {
    setMembers((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));
  }

  return (
    <div className="prisma-card space-y-3 p-4">
      <h3 className="text-sm font-semibold">Bentuk Tim Investigasi</h3>
      <div>
        <label className="field-label">Ketua tim (lead)</label>
        <select className="field-input" value={leadId} onChange={(e) => setLeadId(e.target.value)}>
          <option value="">Pilih ketua…</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>
      <div>
        <label className="field-label">Anggota</label>
        <div className="flex flex-wrap gap-2">
          {users.map((u) => (
            <label key={u.id} className={`badge cursor-pointer ${members.includes(u.id) ? 'badge-mineral' : 'badge-graphite'}`}>
              <input type="checkbox" className="mr-1" checked={members.includes(u.id)} onChange={() => toggleMember(u.id)} />
              {u.name}
            </label>
          ))}
        </div>
      </div>
      {error && <p className="field-error">{error}</p>}
      <button
        className="btn-primary"
        disabled={!leadId || pending}
        onClick={() =>
          startTransition(async () => {
            try {
              await startInvestigationAction(incidentId, leadId, members);
              router.refresh();
            } catch (e: any) {
              setError(e?.message ?? 'Gagal memulai investigasi.');
            }
          })
        }
      >
        {pending ? 'Memproses…' : 'Mulai Investigasi'}
      </button>
    </div>
  );
}
