'use server';

import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { newId } from '@/lib/ids';
import { assertCan } from '@/lib/rbac';
import { recordAudit } from '@/lib/audit';

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  return session;
}

export async function createClientAction(formData: FormData) {
  const session = await requireSession();
  assertCan(session.user.role, 'master', 'admin');
  const id = newId();
  await db.client.create({
    data: {
      id,
      code: String(formData.get('code')),
      name: String(formData.get('name')),
      iupNo: (formData.get('iupNo') as string) || null,
      kttName: (formData.get('kttName') as string) || null
    }
  });
  await recordAudit({ actorId: session.user.id, role: session.user.role, entity: 'Client', entityId: id, action: 'CREATE' });
  revalidatePath('/master-data');
}

export async function createSiteAction(formData: FormData) {
  const session = await requireSession();
  assertCan(session.user.role, 'master', 'admin');
  const id = newId();
  await db.site.create({
    data: {
      id,
      clientId: String(formData.get('clientId')),
      code: String(formData.get('code')),
      name: String(formData.get('name')),
      tz: (formData.get('tz') as string) || 'Asia/Jakarta'
    }
  });
  await recordAudit({ actorId: session.user.id, role: session.user.role, entity: 'Site', entityId: id, action: 'CREATE' });
  revalidatePath('/master-data');
}

export async function createLocationAction(formData: FormData) {
  const session = await requireSession();
  assertCan(session.user.role, 'master', 'admin');
  const id = newId();
  await db.location.create({
    data: {
      id,
      siteId: String(formData.get('siteId')),
      name: String(formData.get('name')),
      areaType: String(formData.get('areaType'))
    }
  });
  await recordAudit({ actorId: session.user.id, role: session.user.role, entity: 'Location', entityId: id, action: 'CREATE' });
  revalidatePath('/master-data');
}

export async function createWorkerAction(formData: FormData) {
  const session = await requireSession();
  assertCan(session.user.role, 'master', 'admin');
  const id = newId();
  await db.worker.create({
    data: {
      id,
      nik: String(formData.get('nik')),
      name: String(formData.get('name')),
      dept: (formData.get('dept') as string) || null,
      position: (formData.get('position') as string) || null,
      empStatus: String(formData.get('empStatus'))
    }
  });
  await recordAudit({ actorId: session.user.id, role: session.user.role, entity: 'Worker', entityId: id, action: 'CREATE' });
  revalidatePath('/master-data');
}

export async function createEquipmentAction(formData: FormData) {
  const session = await requireSession();
  assertCan(session.user.role, 'master', 'admin');
  const id = newId();
  await db.equipment.create({
    data: {
      id,
      unitCode: String(formData.get('unitCode')),
      type: String(formData.get('type')),
      make: (formData.get('make') as string) || null,
      model: (formData.get('model') as string) || null
    }
  });
  await recordAudit({ actorId: session.user.id, role: session.user.role, entity: 'Equipment', entityId: id, action: 'CREATE' });
  revalidatePath('/master-data');
}

export async function createUserAccountAction(formData: FormData) {
  const session = await requireSession();
  assertCan(session.user.role, 'master', 'admin');
  const bcrypt = await import('bcryptjs');
  const id = newId();
  const passwordHash = await bcrypt.hash(String(formData.get('password')), 10);
  await db.userAccount.create({
    data: {
      id,
      workerId: String(formData.get('workerId')),
      email: String(formData.get('email')).toLowerCase().trim(),
      passwordHash,
      role: String(formData.get('role')) as any
    }
  });
  await recordAudit({ actorId: session.user.id, role: session.user.role, entity: 'UserAccount', entityId: id, action: 'CREATE' });
  revalidatePath('/master-data');
}

export async function recordManHoursAction(formData: FormData) {
  const session = await requireSession();
  assertCan(session.user.role, 'master', 'admin');
  const id = newId();
  await db.manHoursInput.create({
    data: {
      id,
      siteId: String(formData.get('siteId')),
      clientId: String(formData.get('clientId')),
      period: String(formData.get('period')),
      hours: Number(formData.get('hours')),
      headcount: Number(formData.get('headcount')),
      source: 'MANUAL'
    }
  });
  await recordAudit({ actorId: session.user.id, role: session.user.role, entity: 'ManHoursInput', entityId: id, action: 'CREATE' });
  revalidatePath('/dashboard');
}
