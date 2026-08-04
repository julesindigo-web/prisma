'use server';

import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { newId, nextHumanNo } from '@/lib/ids';
import { assertCan } from '@/lib/rbac';
import { recordAudit } from '@/lib/audit';
import { computeHipo, validateIncidentSubmit, flagGpsAccuracy, type IncidentVictimInput } from '@/lib/validation';
import { submitIncident as transitionSubmit, voidIncident as transitionVoid } from '@/lib/state-machine';

export interface IncidentFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  return session;
}

export async function createIncidentDraft(formData: FormData): Promise<IncidentFormState> {
  const session = await requireSession();
  assertCan(session.user.role, 'incident', 'create');

  const clientId = String(formData.get('clientId') ?? '');
  const siteId = String(formData.get('siteId') ?? '');
  const locationId = (formData.get('locationId') as string) || null;
  const title = String(formData.get('title') ?? '');
  const incidentDt = new Date(String(formData.get('incidentDt') ?? ''));
  const shift = String(formData.get('shift') ?? '');
  const weather = (formData.get('weather') as string) || null;
  const regType = String(formData.get('regType') ?? 'NA') as 'KT' | 'KB' | 'PAK' | 'NA';
  const kbSpecCode = (formData.get('kbSpecCode') as string) || null;
  const mgmtCategory = String(formData.get('mgmtCategory') ?? 'INJ') as 'INJ' | 'PD' | 'ENV' | 'PB' | 'MECH';
  const indClass = String(formData.get('indClass') ?? 'NM') as 'NM' | 'FAI' | 'MTI' | 'RWTC' | 'LTI' | 'FAT' | 'PD';
  let regClass = String(formData.get('regClass') ?? 'NA');
  const potentialSev = Number(formData.get('potentialSev') ?? 1);
  const description = String(formData.get('description') ?? '');
  const workDayNo = formData.get('workDayNo') ? Number(formData.get('workDayNo')) : null;
  const gpsLat = formData.get('gpsLat') ? Number(formData.get('gpsLat')) : null;
  const gpsLng = formData.get('gpsLng') ? Number(formData.get('gpsLng')) : null;
  const gpsAccuracy = formData.get('gpsAccuracy') ? Number(formData.get('gpsAccuracy')) : null;

  // V-23 auto-consistency for NA/PAK
  if (regType === 'NA') regClass = 'NA';
  if (regType === 'PAK') regClass = 'PAK';

  const victimsRaw = String(formData.get('victimsJson') ?? '[]');
  const equipmentRaw = String(formData.get('equipmentIdsJson') ?? '[]');
  let victims: IncidentVictimInput[] = [];
  let equipmentIds: string[] = [];
  try {
    victims = JSON.parse(victimsRaw);
    equipmentIds = JSON.parse(equipmentRaw);
  } catch {
    return { error: 'Format data korban/peralatan tidak valid.' };
  }

  const hipo = computeHipo(potentialSev);

  try {
    validateIncidentSubmit({
      incidentDt,
      regType,
      regClass,
      kbSpecCode,
      mgmtCategory,
      indClass,
      potentialSev,
      workDayNo,
      description,
      victims,
      equipmentIds,
      gpsAccuracy
    });
  } catch (e: any) {
    if (e?.fields) {
      const fieldErrors: Record<string, string> = {};
      for (const f of e.fields) fieldErrors[f.field] = `${f.code}: ${f.message}`;
      return { error: 'Validasi gagal.', fieldErrors };
    }
    return { error: 'Terjadi kesalahan validasi.' };
  }

  const humanNo = await nextHumanNo('INC');
  const id = newId();

  await db.incident.create({
    data: {
      id,
      humanNo,
      clientId,
      siteId,
      locationId,
      title,
      incidentDt,
      shift,
      weather,
      regType,
      kbSpecCode,
      mgmtCategory,
      indClass,
      regClass,
      potentialSev,
      hipo,
      description,
      preservation: {},
      workDayNo,
      status: 'DRAFT',
      createdBy: session.user.id,
      gpsLat,
      gpsLng,
      gpsAccuracy,
      victims: {
        create: victims.map((v) => ({
          id: newId(),
          workerId: v.workerId,
          expY: v.expY,
          expM: v.expM,
          lostDays: v.lostDays,
          ongoing: v.ongoing ?? false,
          outcome: v.outcome ?? null
        }))
      },
      equipmentLinks: {
        create: equipmentIds.map((eqId) => ({ id: newId(), equipmentId: eqId }))
      }
    }
  });

  await recordAudit({ actorId: session.user.id, role: session.user.role, entity: 'Incident', entityId: id, action: 'CREATE', after: { humanNo, status: 'DRAFT' } });

  if (flagGpsAccuracy(gpsAccuracy)) {
    await recordAudit({ actorId: session.user.id, role: session.user.role, entity: 'Incident', entityId: id, action: 'UPDATE', reason: 'V-28: akurasi GPS > 50m' });
  }

  revalidatePath('/incidents');
  redirect(`/incidents/${id}`);
}

export async function submitIncidentAction(incidentId: string) {
  const session = await requireSession();
  assertCan(session.user.role, 'incident', 'update');
  await transitionSubmit(incidentId, session.user.id, session.user.role);
  revalidatePath(`/incidents/${incidentId}`);
}

export async function voidIncidentAction(incidentId: string, reason: string, approvedByPjo: boolean) {
  const session = await requireSession();
  assertCan(session.user.role, 'incident', 'void');
  await transitionVoid(incidentId, reason, approvedByPjo, session.user.id, session.user.role);
  revalidatePath(`/incidents/${incidentId}`);
}
