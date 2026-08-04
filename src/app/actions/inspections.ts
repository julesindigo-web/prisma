'use server';

import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { newId, nextHumanNo } from '@/lib/ids';
import { assertCan } from '@/lib/rbac';
import { recordAudit } from '@/lib/audit';

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  return session;
}

export async function scheduleInspectionAction(formData: FormData) {
  const session = await requireSession();
  assertCan(session.user.role, 'inspection', 'create');

  const templateId = String(formData.get('templateId') ?? '');
  const siteId = String(formData.get('siteId') ?? '');
  const equipmentId = (formData.get('equipmentId') as string) || null;
  const locationId = (formData.get('locationId') as string) || null;
  const dt = new Date(String(formData.get('dt') ?? new Date().toISOString()));

  const humanNo = await nextHumanNo('INS');
  const id = newId();

  await db.inspectionRecord.create({
    data: { id, humanNo, templateId, siteId, equipmentId, locationId, performerId: session.user.id, dt, status: 'SCHEDULED' }
  });
  await recordAudit({ actorId: session.user.id, role: session.user.role, entity: 'InspectionRecord', entityId: id, action: 'CREATE', after: { humanNo } });

  revalidatePath('/inspections');
}

export interface InspectionItemInput {
  itemCode: string;
  result: 'OK' | 'DEFECT' | 'NA';
  note?: string;
  photo?: string;
  sev?: number;
}

export async function completeInspectionAction(recordId: string, items: InspectionItemInput[]) {
  const session = await requireSession();
  assertCan(session.user.role, 'inspection', 'update');

  const hasDefect = items.some((i) => i.result === 'DEFECT');
  const defectsMissingPhoto = items.some((i) => i.result === 'DEFECT' && !i.photo);
  if (defectsMissingPhoto) {
    throw new Error('VAL_422: setiap defect wajib disertai foto.');
  }

  await db.$transaction(async (tx) => {
    await tx.inspectionItem.createMany({
      data: items.map((i) => ({ id: newId(), recordId, itemCode: i.itemCode, result: i.result, note: i.note, photo: i.photo, sev: i.sev }))
    });
    await tx.inspectionRecord.update({ where: { id: recordId }, data: { status: hasDefect ? 'FOLLOW_UP' : 'DONE' } });
  });

  await recordAudit({ actorId: session.user.id, role: session.user.role, entity: 'InspectionRecord', entityId: recordId, action: 'UPDATE', after: { status: hasDefect ? 'FOLLOW_UP' : 'DONE' } });

  if (hasDefect) {
    const record = await db.inspectionRecord.findUniqueOrThrow({ where: { id: recordId } });
    const humanNo = await nextHumanNo('CAP');
    const capaId = newId();
    await db.capa.create({
      data: {
        id: capaId,
        humanNo,
        source: 'INSPECTION',
        sourceRef: record.humanNo,
        action: `Tindak lanjut temuan defect pada inspeksi ${record.humanNo}`,
        controlType: 'ENG',
        priority: 'P2',
        picId: session.user.workerId,
        dueD: new Date(Date.now() + 30 * 86400000),
        status: 'OPEN'
      }
    });
    await db.inspectionRecord.update({ where: { id: recordId }, data: { followupRef: humanNo } });
  }

  revalidatePath('/inspections');
  revalidatePath(`/inspections/${recordId}`);
}

export async function closeInspectionAction(recordId: string) {
  const session = await requireSession();
  assertCan(session.user.role, 'inspection', 'update');
  await db.inspectionRecord.update({ where: { id: recordId }, data: { status: 'CLOSED' } });
  await recordAudit({ actorId: session.user.id, role: session.user.role, entity: 'InspectionRecord', entityId: recordId, action: 'UPDATE', after: { status: 'CLOSED' } });
  revalidatePath('/inspections');
}
