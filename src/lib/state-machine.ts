import { db } from './db';
import { newId } from './ids';
import { recordAudit } from './audit';
import { getRclNumber, RCL_KEYS, assertRegClassProdReady } from './rcl';
import { validateCapaClose, validateCapaVerifier } from './validation';
import type { Role } from '@prisma/client';

export class TransitionError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

async function notify(code: string, channel: string, recipient: string, subject: string, body: string, entityType?: string, entityId?: string) {
  await db.notificationLog.create({
    data: { id: newId(), code, channel, recipient, subject, body, entityType, entityId }
  });
}

// ───────────────────────────────────────────────────────────────────────
// §5 INCIDENT STATE MACHINE
// ───────────────────────────────────────────────────────────────────────

export async function submitIncident(incidentId: string, actorId: string, actorRole: Role) {
  const incident = await db.incident.findUniqueOrThrow({ where: { id: incidentId } });
  if (incident.status !== 'DRAFT') throw new TransitionError('CONF_409', 'Insiden bukan berstatus Draft.');

  const invDeadlineH = await getRclNumber(RCL_KEYS.INVESTIGATION_DEADLINE_HOURS, 48);
  const disnakerDeadlineH = await getRclNumber(RCL_KEYS.DISNAKER_REPORT_DEADLINE_HOURS, 48);
  const escalateBeforeH = await getRclNumber(RCL_KEYS.ESCALATE_BEFORE_HOURS, 6);

  const clockStart = incident.incidentDt;
  const invDeadline = new Date(clockStart.getTime() + invDeadlineH * 3600000);

  const updated = await db.$transaction(async (tx) => {
    const inc = await tx.incident.update({
      where: { id: incidentId },
      data: { status: 'SUBMITTED', version: { increment: 1 } }
    });
    await tx.slaEvent.create({
      data: {
        id: newId(),
        entityType: 'INCIDENT',
        entityId: incident.id,
        incidentId: incident.id,
        kind: 'INVESTIGATION_DEADLINE',
        clockStart,
        deadline: invDeadline,
        escalations: [{ hoursBefore: escalateBeforeH, note: 'Eskalasi otomatis ke HSE' }]
      }
    });
    if (incident.regType !== 'NA') {
      await tx.slaEvent.create({
        data: {
          id: newId(),
          entityType: 'INCIDENT',
          entityId: incident.id,
          incidentId: incident.id,
          kind: 'DISNAKER_REPORT',
          clockStart,
          deadline: new Date(clockStart.getTime() + disnakerDeadlineH * 3600000)
        }
      });
    }
    return inc;
  });

  await recordAudit({ actorId, role: actorRole, entity: 'Incident', entityId: incidentId, action: 'TRANSITION', before: { status: 'DRAFT' }, after: { status: 'SUBMITTED' } });
  await notify('N-01', 'IN_APP', 'HSE+PENGAWAS', 'Insiden baru dilaporkan', `Insiden ${incident.humanNo} telah disubmit.`, 'Incident', incidentId);
  return updated;
}

export async function startInvestigation(incidentId: string, leadUserId: string, members: string[], actorId: string, actorRole: Role) {
  const incident = await db.incident.findUniqueOrThrow({ where: { id: incidentId } });
  if (incident.status !== 'SUBMITTED') throw new TransitionError('CONF_409', 'Insiden harus berstatus Submitted.');

  const result = await db.$transaction(async (tx) => {
    const investigation = await tx.investigation.create({
      data: {
        id: newId(),
        incidentId,
        method: incident.hipo || incident.indClass === 'FAT' ? 'SCAT_ICAM' : 'SCAT', // V-08
        startDt: new Date(),
        leadId: leadUserId,
        members
      }
    });
    await tx.incident.update({ where: { id: incidentId }, data: { status: 'INVESTIGATING', version: { increment: 1 } } });
    return investigation;
  });

  await recordAudit({ actorId, role: actorRole, entity: 'Incident', entityId: incidentId, action: 'TRANSITION', before: { status: 'SUBMITTED' }, after: { status: 'INVESTIGATING' } });
  await notify('N-02', 'IN_APP', 'lead+members', 'Tim investigasi dibentuk', `Investigasi untuk ${incident.humanNo} dimulai.`, 'Investigation', result.id);
  return result;
}

export async function moveToReportDraft(investigationId: string, actorId: string, actorRole: Role) {
  const inv = await db.investigation.findUniqueOrThrow({ where: { id: investigationId }, include: { scatEntries: true, incident: true } });
  if (inv.scatEntries.length === 0) throw new TransitionError('VAL_422', 'Minimal 1 entri SCAT diperlukan sebelum draft laporan.');

  await db.$transaction(async (tx) => {
    await tx.investigation.update({ where: { id: investigationId }, data: { status: 'REPORT_DRAFT' } });
    await tx.incident.update({ where: { id: inv.incidentId }, data: { status: 'REPORT_DRAFT', version: { increment: 1 } } });
  });
  await recordAudit({ actorId, role: actorRole, entity: 'Investigation', entityId: investigationId, action: 'TRANSITION', after: { status: 'REPORT_DRAFT' } });
}

export async function submitForHseReview(investigationId: string, qualityReview: Record<string, boolean>, actorId: string, actorRole: Role) {
  const inv = await db.investigation.findUniqueOrThrow({ where: { id: investigationId } });
  const allChecked = Object.values(qualityReview).every(Boolean);
  if (!allChecked) throw new TransitionError('VAL_422', 'Checklist kualitas investigasi belum lengkap.');

  await db.$transaction(async (tx) => {
    await tx.investigation.update({ where: { id: investigationId }, data: { status: 'HSE_REVIEW', qualityReview } });
    await tx.incident.update({ where: { id: inv.incidentId }, data: { status: 'HSE_REVIEW', version: { increment: 1 } } });
  });
  await recordAudit({ actorId, role: actorRole, entity: 'Investigation', entityId: investigationId, action: 'TRANSITION', after: { status: 'HSE_REVIEW' } });
  await notify('N-03', 'IN_APP', 'HSE', 'Investigasi menunggu review', 'Batas waktu review H-6 jam.', 'Investigation', investigationId);
}

/** PJO Final sign-off (simulated OTP: caller must pass otpConfirmed=true from a verified challenge). */
export async function finalizeInvestigation(investigationId: string, otpConfirmed: boolean, actorId: string, actorRole: Role) {
  if (actorRole !== 'PJO' && actorRole !== 'SO') throw new TransitionError('AUTH_403', 'Hanya PJO yang dapat mengesahkan Final.');
  if (!otpConfirmed) throw new TransitionError('AUTH_401', 'Konfirmasi OTP diperlukan untuk pengesahan Final.');

  const inv = await db.investigation.findUniqueOrThrow({ where: { id: investigationId }, include: { incident: true } });
  assertRegClassProdReady(inv.incident.regClass);

  await db.$transaction(async (tx) => {
    await tx.investigation.update({ where: { id: investigationId }, data: { status: 'FINAL' } });
    await tx.incident.update({ where: { id: inv.incidentId }, data: { status: 'FINAL', version: { increment: 1 } } });
  });
  await recordAudit({ actorId, role: actorRole, entity: 'Investigation', entityId: investigationId, action: 'TRANSITION', after: { status: 'FINAL' } });
  await notify('N-04', 'EMAIL', 'MGMT+SO', 'Investigasi disahkan Final', 'Laporan investigasi telah final dan immutable.', 'Investigation', investigationId);
}

export async function markIncidentReported(incidentId: string, receiptRef: string, actorId: string, actorRole: Role) {
  const incident = await db.incident.findUniqueOrThrow({ where: { id: incidentId } });
  if (incident.status !== 'FINAL') throw new TransitionError('CONF_409', 'Insiden harus berstatus Final.');

  await db.incident.update({ where: { id: incidentId }, data: { status: 'REPORTED', version: { increment: 1 } } });
  await db.slaEvent.updateMany({ where: { incidentId, kind: 'DISNAKER_REPORT', status: 'OPEN' }, data: { status: 'MET', resolvedAt: new Date() } });
  await recordAudit({ actorId, role: actorRole, entity: 'Incident', entityId: incidentId, action: 'TRANSITION', after: { status: 'REPORTED', receiptRef } });
  await notify('N-05', 'EMAIL', 'PJO', 'Laporan terkirim ke regulator', `Bukti kirim: ${receiptRef}`, 'Incident', incidentId);
}

export async function closeIncident(incidentId: string, actorId: string, actorRole: Role) {
  const incident = await db.incident.findUniqueOrThrow({ where: { id: incidentId }, include: { capas: true } });
  if (incident.status !== 'REPORTED') throw new TransitionError('CONF_409', 'Insiden harus berstatus Reported.');
  const allCapaClosed = incident.capas.every((c) => c.status === 'CLOSED');
  if (!allCapaClosed) throw new TransitionError('VAL_422', 'Seluruh CAPA terkait wajib Closed sebelum insiden ditutup.');

  await db.incident.update({ where: { id: incidentId }, data: { status: 'CLOSED', version: { increment: 1 } } });
  await recordAudit({ actorId, role: actorRole, entity: 'Incident', entityId: incidentId, action: 'TRANSITION', after: { status: 'CLOSED' } });
}

export async function voidIncident(incidentId: string, reason: string, approvedByPjo: boolean, actorId: string, actorRole: Role) {
  if (actorRole !== 'SO') throw new TransitionError('AUTH_403', 'Hanya System Owner yang dapat membatalkan (Void) insiden.');
  if (!reason) throw new TransitionError('VAL_422', 'Alasan pembatalan wajib diisi.');
  if (!approvedByPjo) throw new TransitionError('AUTH_403', 'Persetujuan PJO diperlukan untuk Void.');

  const before = await db.incident.findUniqueOrThrow({ where: { id: incidentId } });
  await db.incident.update({ where: { id: incidentId }, data: { status: 'VOID', voidReason: reason, statsIncluded: false, version: { increment: 1 } } });
  await recordAudit({ actorId, role: actorRole, entity: 'Incident', entityId: incidentId, action: 'VOID', before: { status: before.status }, reason });
  await notify('N-06', 'IN_APP', 'SO+PJO', 'Insiden dibatalkan', reason, 'Incident', incidentId);
}

// ───────────────────────────────────────────────────────────────────────
// §5 CAPA STATE MACHINE
// ───────────────────────────────────────────────────────────────────────

export async function startCapa(capaId: string, actorId: string, actorRole: Role) {
  const capa = await db.capa.findUniqueOrThrow({ where: { id: capaId } });
  if (capa.status !== 'OPEN' && capa.status !== 'REOPENED') throw new TransitionError('CONF_409', 'CAPA tidak dalam status Open/Reopened.');
  await db.capa.update({ where: { id: capaId }, data: { status: 'IN_PROGRESS' } });
  await recordAudit({ actorId, role: actorRole, entity: 'Capa', entityId: capaId, action: 'TRANSITION', after: { status: 'IN_PROGRESS' } });
}

export async function submitCapaForVerification(capaId: string, evidence: unknown[], actorId: string, actorRole: Role) {
  const capa = await db.capa.findUniqueOrThrow({ where: { id: capaId } });
  if (capa.status !== 'IN_PROGRESS') throw new TransitionError('CONF_409', 'CAPA harus berstatus In Progress.');
  validateCapaClose(evidence);

  await db.capa.update({ where: { id: capaId }, data: { status: 'AWAITING_VERIFICATION', evidence: evidence as any, progress: 100 } });
  await recordAudit({ actorId, role: actorRole, entity: 'Capa', entityId: capaId, action: 'TRANSITION', after: { status: 'AWAITING_VERIFICATION' } });
  await notify('N-07', 'IN_APP', 'verifier', 'CAPA menunggu verifikasi', `CAPA ${capa.humanNo} siap diverifikasi.`, 'Capa', capaId);
}

export async function closeCapa(capaId: string, verifierId: string, verifyResult: 'EFEKTIF' | 'TIDAK_EFEKTIF', actorId: string, actorRole: Role) {
  const capa = await db.capa.findUniqueOrThrow({ where: { id: capaId }, include: { pic: true, verifier: { include: { worker: true } } } });
  if (capa.status !== 'AWAITING_VERIFICATION') throw new TransitionError('CONF_409', 'CAPA harus berstatus Awaiting Verification.');

  const verifierAccount = await db.userAccount.findUniqueOrThrow({ where: { id: verifierId } });
  validateCapaVerifier(verifierAccount.workerId, capa.picId); // V-12
  validateCapaClose(capa.evidence as unknown[]); // V-20

  if (verifyResult === 'TIDAK_EFEKTIF') {
    await reopenCapa(capaId, actorId, actorRole);
    return;
  }

  await db.capa.update({ where: { id: capaId }, data: { status: 'CLOSED', verifierId, verifyDt: new Date(), verifyResult } });
  await recordAudit({ actorId, role: actorRole, entity: 'Capa', entityId: capaId, action: 'TRANSITION', after: { status: 'CLOSED', verifyResult } });
  await notify('N-08', 'IN_APP', 'pic+HSE', 'CAPA ditutup', `CAPA ${capa.humanNo} ditutup EFEKTIF.`, 'Capa', capaId);
}

/** V-13: recurrence — reopening within the configured window flags recurrence. */
export async function reopenCapa(capaId: string, actorId: string, actorRole: Role) {
  const capa = await db.capa.findUniqueOrThrow({ where: { id: capaId } });
  const windowHours = await getRclNumber(RCL_KEYS.RECURRENCE_WINDOW_HOURS, 2160); // default 90 days
  const withinWindow = Date.now() - capa.createdAt.getTime() <= windowHours * 3600000;

  await db.capa.update({
    where: { id: capaId },
    data: { status: 'REOPENED', reopenCount: { increment: 1 }, recurrenceFlag: withinWindow, verifyResult: 'TIDAK_EFEKTIF' }
  });
  await recordAudit({ actorId, role: actorRole, entity: 'Capa', entityId: capaId, action: 'TRANSITION', after: { status: 'REOPENED' } });
  await notify('N-09', 'WA', 'pic+HSE+SO', 'CAPA dibuka kembali', `CAPA ${capa.humanNo} tidak efektif, dibuka kembali.`, 'Capa', capaId);
}

// ───────────────────────────────────────────────────────────────────────
// PROACTIVE REPORT STATE MACHINE
// ───────────────────────────────────────────────────────────────────────

export async function acknowledgeProactive(reportId: string, actorId: string, actorRole: Role) {
  const report = await db.proactiveReport.findUniqueOrThrow({ where: { id: reportId } });
  if (report.status !== 'NEW') throw new TransitionError('CONF_409', 'Laporan harus berstatus New.');
  await db.proactiveReport.update({ where: { id: reportId }, data: { status: 'ACKNOWLEDGED', responseDt: new Date() } });
  await recordAudit({ actorId, role: actorRole, entity: 'ProactiveReport', entityId: reportId, action: 'TRANSITION', after: { status: 'ACKNOWLEDGED' } });
}

export async function actionProactive(reportId: string, actorId: string, actorRole: Role) {
  const report = await db.proactiveReport.findUniqueOrThrow({ where: { id: reportId } });
  if (report.status !== 'ACKNOWLEDGED') throw new TransitionError('CONF_409', 'Laporan harus berstatus Acknowledged.');
  await db.proactiveReport.update({ where: { id: reportId }, data: { status: 'ACTIONED' } });
  await recordAudit({ actorId, role: actorRole, entity: 'ProactiveReport', entityId: reportId, action: 'TRANSITION', after: { status: 'ACTIONED' } });
}

export async function closeProactive(reportId: string, actorId: string, actorRole: Role) {
  const report = await db.proactiveReport.findUniqueOrThrow({ where: { id: reportId } });
  if (report.status !== 'ACTIONED') throw new TransitionError('CONF_409', 'Laporan harus berstatus Actioned.');
  await db.proactiveReport.update({ where: { id: reportId }, data: { status: 'CLOSED' } });
  await recordAudit({ actorId, role: actorRole, entity: 'ProactiveReport', entityId: reportId, action: 'TRANSITION', after: { status: 'CLOSED' } });
}
