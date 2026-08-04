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

// ── Update Actions ──

export async function updateClientAction(formData: FormData) {
  const session = await requireSession();
  assertCan(session.user.role, 'master', 'admin');
  const id = String(formData.get('id'));
  try {
    const before = await db.client.findUnique({ where: { id } });
    await db.client.update({
      where: { id },
      data: {
        code: String(formData.get('code')),
        name: String(formData.get('name')),
        iupNo: (formData.get('iupNo') as string) || null,
        kttName: (formData.get('kttName') as string) || null
      }
    });
    await recordAudit({ actorId: session.user.id, role: session.user.role, entity: 'Client', entityId: id, action: 'UPDATE', before, after: { code: formData.get('code'), name: formData.get('name') } });
    revalidatePath('/master-data');
  } catch (e) {
    return { error: humanizeConstraintError(e) };
  }
}

export async function updateSiteAction(formData: FormData) {
  const session = await requireSession();
  assertCan(session.user.role, 'master', 'admin');
  const id = String(formData.get('id'));
  try {
    const before = await db.site.findUnique({ where: { id } });
    await db.site.update({
      where: { id },
      data: {
        clientId: String(formData.get('clientId')),
        code: String(formData.get('code')),
        name: String(formData.get('name')),
        tz: (formData.get('tz') as string) || 'Asia/Jakarta'
      }
    });
    await recordAudit({ actorId: session.user.id, role: session.user.role, entity: 'Site', entityId: id, action: 'UPDATE', before, after: { code: formData.get('code'), name: formData.get('name') } });
    revalidatePath('/master-data');
  } catch (e) {
    return { error: humanizeConstraintError(e) };
  }
}

export async function updateLocationAction(formData: FormData) {
  const session = await requireSession();
  assertCan(session.user.role, 'master', 'admin');
  const id = String(formData.get('id'));
  try {
    const before = await db.location.findUnique({ where: { id } });
    await db.location.update({
      where: { id },
      data: {
        siteId: String(formData.get('siteId')),
        name: String(formData.get('name')),
        areaType: String(formData.get('areaType'))
      }
    });
    await recordAudit({ actorId: session.user.id, role: session.user.role, entity: 'Location', entityId: id, action: 'UPDATE', before, after: { name: formData.get('name') } });
    revalidatePath('/master-data');
  } catch (e) {
    return { error: humanizeConstraintError(e) };
  }
}

export async function updateWorkerAction(formData: FormData) {
  const session = await requireSession();
  assertCan(session.user.role, 'master', 'admin');
  const id = String(formData.get('id'));
  try {
    const before = await db.worker.findUnique({ where: { id } });
    await db.worker.update({
      where: { id },
      data: {
        nik: String(formData.get('nik')),
        name: String(formData.get('name')),
        dept: (formData.get('dept') as string) || null,
        position: (formData.get('position') as string) || null,
        empStatus: String(formData.get('empStatus'))
      }
    });
    await recordAudit({ actorId: session.user.id, role: session.user.role, entity: 'Worker', entityId: id, action: 'UPDATE', before, after: { nik: formData.get('nik'), name: formData.get('name') } });
    revalidatePath('/master-data');
  } catch (e) {
    return { error: humanizeConstraintError(e) };
  }
}

export async function updateEquipmentAction(formData: FormData) {
  const session = await requireSession();
  assertCan(session.user.role, 'master', 'admin');
  const id = String(formData.get('id'));
  try {
    const before = await db.equipment.findUnique({ where: { id } });
    await db.equipment.update({
      where: { id },
      data: {
        unitCode: String(formData.get('unitCode')),
        type: String(formData.get('type')),
        make: (formData.get('make') as string) || null,
        model: (formData.get('model') as string) || null
      }
    });
    await recordAudit({ actorId: session.user.id, role: session.user.role, entity: 'Equipment', entityId: id, action: 'UPDATE', before, after: { unitCode: formData.get('unitCode') } });
    revalidatePath('/master-data');
  } catch (e) {
    return { error: humanizeConstraintError(e) };
  }
}

function humanizeConstraintError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes('Foreign key constraint failed')) return 'Data masih digunakan oleh record lain. Hapus data terkait terlebih dahulu.';
  if (msg.includes('Unique constraint failed')) return 'Data dengan kode/nama yang sama sudah ada.';
  return 'Terjadi kesalahan database. Silakan coba lagi.';
}

// ── Delete Actions ──

export async function deleteClientAction(formData: FormData) {
  const session = await requireSession();
  assertCan(session.user.role, 'master', 'admin');
  const id = String(formData.get('id'));
  try {
    const before = await db.client.findUnique({ where: { id } });
    await db.client.delete({ where: { id } });
    await recordAudit({ actorId: session.user.id, role: session.user.role, entity: 'Client', entityId: id, action: 'DELETE', before });
    revalidatePath('/master-data');
  } catch (e) {
    return { error: humanizeConstraintError(e) };
  }
}

export async function deleteSiteAction(formData: FormData) {
  const session = await requireSession();
  assertCan(session.user.role, 'master', 'admin');
  const id = String(formData.get('id'));
  try {
    const before = await db.site.findUnique({ where: { id } });
    await db.site.delete({ where: { id } });
    await recordAudit({ actorId: session.user.id, role: session.user.role, entity: 'Site', entityId: id, action: 'DELETE', before });
    revalidatePath('/master-data');
  } catch (e) {
    return { error: humanizeConstraintError(e) };
  }
}

export async function deleteLocationAction(formData: FormData) {
  const session = await requireSession();
  assertCan(session.user.role, 'master', 'admin');
  const id = String(formData.get('id'));
  try {
    const before = await db.location.findUnique({ where: { id } });
    await db.location.delete({ where: { id } });
    await recordAudit({ actorId: session.user.id, role: session.user.role, entity: 'Location', entityId: id, action: 'DELETE', before });
    revalidatePath('/master-data');
  } catch (e) {
    return { error: humanizeConstraintError(e) };
  }
}

export async function deleteWorkerAction(formData: FormData) {
  const session = await requireSession();
  assertCan(session.user.role, 'master', 'admin');
  const id = String(formData.get('id'));
  try {
    const before = await db.worker.findUnique({ where: { id } });
    await db.worker.delete({ where: { id } });
    await recordAudit({ actorId: session.user.id, role: session.user.role, entity: 'Worker', entityId: id, action: 'DELETE', before });
    revalidatePath('/master-data');
  } catch (e) {
    return { error: humanizeConstraintError(e) };
  }
}

export async function deleteEquipmentAction(formData: FormData) {
  const session = await requireSession();
  assertCan(session.user.role, 'master', 'admin');
  const id = String(formData.get('id'));
  try {
    const before = await db.equipment.findUnique({ where: { id } });
    await db.equipment.delete({ where: { id } });
    await recordAudit({ actorId: session.user.id, role: session.user.role, entity: 'Equipment', entityId: id, action: 'DELETE', before });
    revalidatePath('/master-data');
  } catch (e) {
    return { error: humanizeConstraintError(e) };
  }
}
