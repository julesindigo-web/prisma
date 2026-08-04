'use server';

import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { newId } from '@/lib/ids';
import { assertCan } from '@/lib/rbac';
import {
  startInvestigation,
  moveToReportDraft,
  submitForHseReview,
  finalizeInvestigation
} from '@/lib/state-machine';

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  return session;
}

export async function startInvestigationAction(incidentId: string, leadUserId: string, memberIds: string[]) {
  const session = await requireSession();
  assertCan(session.user.role, 'investigation', 'create');
  await startInvestigation(incidentId, leadUserId, memberIds, session.user.id, session.user.role);
  revalidatePath(`/incidents/${incidentId}`);
}

export async function addScatEntryAction(investigationId: string, phase: string, code: string, label: string, note: string) {
  const session = await requireSession();
  assertCan(session.user.role, 'investigation', 'update');
  await db.scatEntry.create({ data: { id: newId(), investigationId, phase, code, label, note } });
  revalidatePath(`/investigations/${investigationId}`);
}

export async function moveToReportDraftAction(investigationId: string) {
  const session = await requireSession();
  assertCan(session.user.role, 'investigation', 'update');
  await moveToReportDraft(investigationId, session.user.id, session.user.role);
  revalidatePath(`/investigations/${investigationId}`);
}

export async function submitForHseReviewAction(investigationId: string, qualityReview: Record<string, boolean>) {
  const session = await requireSession();
  assertCan(session.user.role, 'investigation', 'update');
  await submitForHseReview(investigationId, qualityReview, session.user.id, session.user.role);
  revalidatePath(`/investigations/${investigationId}`);
}

export async function finalizeInvestigationAction(investigationId: string, otpConfirmed: boolean) {
  const session = await requireSession();
  assertCan(session.user.role, 'investigation', 'approve');
  await finalizeInvestigation(investigationId, otpConfirmed, session.user.id, session.user.role);
  revalidatePath(`/investigations/${investigationId}`);
}

export async function setRootCauseAction(investigationId: string, rootCause: string, findings: string) {
  const session = await requireSession();
  assertCan(session.user.role, 'investigation', 'update');
  await db.investigation.update({ where: { id: investigationId }, data: { rootCause, findings } });
  revalidatePath(`/investigations/${investigationId}`);
}
