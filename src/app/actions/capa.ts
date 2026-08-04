'use server';

import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { newId, nextHumanNo } from '@/lib/ids';
import { assertCan } from '@/lib/rbac';
import { recordAudit } from '@/lib/audit';
import { validateCapaDueDate } from '@/lib/validation';
import { getRclNumber, RCL_KEYS } from '@/lib/rcl';
import { startCapa, submitCapaForVerification, closeCapa } from '@/lib/state-machine';

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  return session;
}

export interface CapaFormState {
  error?: string;
}

export async function createCapaAction(formData: FormData): Promise<CapaFormState> {
  const session = await requireSession();
  assertCan(session.user.role, 'capa', 'create');

  const source = String(formData.get('source') ?? 'INCIDENT');
  const sourceRef = (formData.get('sourceRef') as string) || null;
  const incidentId = (formData.get('incidentId') as string) || null;
  const action = String(formData.get('action') ?? '');
  const controlType = String(formData.get('controlType') ?? 'ADM');
  const priority = String(formData.get('priority') ?? 'P3') as 'P1' | 'P2' | 'P3';
  const picId = String(formData.get('picId') ?? '');
  const dueD = new Date(String(formData.get('dueD') ?? ''));
  const createdAt = new Date();

  const ceilings = {
    P1: await getRclNumber(RCL_KEYS.CAPA_DUE_P1_DAYS, 7),
    P2: await getRclNumber(RCL_KEYS.CAPA_DUE_P2_DAYS, 30),
    P3: await getRclNumber(RCL_KEYS.CAPA_DUE_P3_DAYS, 90)
  };

  try {
    validateCapaDueDate({ priority, dueD, createdAt }, ceilings);
  } catch (e: any) {
    return { error: e?.fields?.[0]?.message ?? 'Tenggat tidak valid.' };
  }

  const humanNo = await nextHumanNo('CAP');
  const id = newId();

  await db.capa.create({
    data: { id, humanNo, source, sourceRef, incidentId, action, controlType, priority, picId, dueD, status: 'OPEN' }
  });
  await recordAudit({ actorId: session.user.id, role: session.user.role, entity: 'Capa', entityId: id, action: 'CREATE', after: { humanNo } });

  if (incidentId) revalidatePath(`/incidents/${incidentId}`);
  revalidatePath('/capa');
  return {};
}

export async function startCapaAction(capaId: string) {
  const session = await requireSession();
  assertCan(session.user.role, 'capa', 'update');
  await startCapa(capaId, session.user.id, session.user.role);
  revalidatePath('/capa');
  revalidatePath(`/capa/${capaId}`);
}

export async function submitCapaForVerificationAction(capaId: string, evidenceNote: string) {
  const session = await requireSession();
  assertCan(session.user.role, 'capa', 'update');
  await submitCapaForVerification(capaId, [{ note: evidenceNote, ts: new Date().toISOString() }], session.user.id, session.user.role);
  revalidatePath('/capa');
  revalidatePath(`/capa/${capaId}`);
}

export async function closeCapaAction(capaId: string, verifierId: string, verifyResult: 'EFEKTIF' | 'TIDAK_EFEKTIF') {
  const session = await requireSession();
  assertCan(session.user.role, 'capa', 'approve');
  await closeCapa(capaId, verifierId, verifyResult, session.user.id, session.user.role);
  revalidatePath('/capa');
  revalidatePath(`/capa/${capaId}`);
}
