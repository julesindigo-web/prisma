'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { acknowledgeProactiveAction, actionProactiveAction, closeProactiveAction } from '@/app/actions/proactive';

export function ProactiveStageActions({ reportId, status }: { reportId: string; status: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function run(fn: () => Promise<void>) {
    startTransition(async () => { await fn(); router.refresh(); });
  }

  if (status === 'NEW') return <button className="btn-secondary text-xs" disabled={pending} onClick={() => run(() => acknowledgeProactiveAction(reportId))}>Terima</button>;
  if (status === 'ACKNOWLEDGED') return <button className="btn-secondary text-xs" disabled={pending} onClick={() => run(() => actionProactiveAction(reportId))}>Tindaklanjuti</button>;
  if (status === 'ACTIONED') return <button className="btn-secondary text-xs" disabled={pending} onClick={() => run(() => closeProactiveAction(reportId))}>Tutup</button>;
  return null;
}
