'use server';

import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { newId, nextHumanNo } from '@/lib/ids';
import { assertCan } from '@/lib/rbac';
import { recordAudit } from '@/lib/audit';
import { acknowledgeProactive, actionProactive, closeProactive } from '@/lib/state-machine';

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  return session;
}

export async function createProactiveReportAction(formData: FormData) {
  const anonymous = formData.get('anonymous') === 'on';
  let session = null;
  if (!anonymous) {
    session = await requireSession();
    assertCan(session.user.role, 'proactive', 'create');
  }

  const siteId = String(formData.get('siteId') ?? '');
  const locationId = (formData.get('locationId') as string) || null;
  const category = String(formData.get('category') ?? '');
  const desc = String(formData.get('desc') ?? '');
  const suggestion = (formData.get('suggestion') as string) || null;
  const sealedContact = anonymous ? (formData.get('sealedContact') as string) || null : null;

  const humanNo = await nextHumanNo('PRW');
  const id = newId();

  await db.proactiveReport.create({
    data: {
      id,
      humanNo,
      reporterId: anonymous ? null : session!.user.workerId, // V-30
      anonymous,
      sealedContact,
      siteId,
      locationId,
      category,
      desc,
      suggestion,
      status: 'NEW'
    }
  });

  await recordAudit({
    actorId: session?.user.id ?? null,
    role: session?.user.role ?? 'PEKERJA',
    entity: 'ProactiveReport',
    entityId: id,
    action: 'CREATE',
    after: { humanNo, anonymous }
  });

  revalidatePath('/proactive');
}

export async function acknowledgeProactiveAction(reportId: string) {
  const session = await requireSession();
  assertCan(session.user.role, 'proactive', 'update');
  await acknowledgeProactive(reportId, session.user.id, session.user.role);
  revalidatePath('/proactive');
}

export async function actionProactiveAction(reportId: string) {
  const session = await requireSession();
  assertCan(session.user.role, 'proactive', 'update');
  await actionProactive(reportId, session.user.id, session.user.role);
  revalidatePath('/proactive');
}

export async function closeProactiveAction(reportId: string) {
  const session = await requireSession();
  assertCan(session.user.role, 'proactive', 'update');
  await closeProactive(reportId, session.user.id, session.user.role);
  revalidatePath('/proactive');
}
