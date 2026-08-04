/**
 * §7 VALIDATION MATRIX (V-01..V-30) — v1.0 build enforces the subset applicable to
 * modules M1-M7, M15-M19. Rules bound to v1.1/v1.2-only modules (induction V-17,
 * MCU V-18, fatigue V-14, cert-of-lead V-10, PTW/JSA) are NOT enforced in this build —
 * documented here rather than silently ignored.
 */

export class ValidationError extends Error {
  code = 'VAL_422';
  fields: { field: string; code: string; message: string }[];
  constructor(fields: { field: string; code: string; message: string }[]) {
    super('Validation failed');
    this.fields = fields;
  }
}

type FieldError = { field: string; code: string; message: string };

export interface IncidentVictimInput {
  workerId: string;
  expY: number;
  expM: number;
  lostDays: number;
  ongoing?: boolean;
  outcome?: string | null;
}

export interface IncidentValidationInput {
  incidentDt: Date;
  regType: 'KT' | 'KB' | 'PAK' | 'NA';
  regClass: string;
  kbSpecCode?: string | null;
  mgmtCategory: 'INJ' | 'PD' | 'ENV' | 'PB' | 'MECH';
  indClass: 'NM' | 'FAI' | 'MTI' | 'RWTC' | 'LTI' | 'FAT' | 'PD';
  potentialSev: number;
  workDayNo?: number | null;
  workdayRefWorkerId?: string | null;
  description: string;
  victims: IncidentVictimInput[];
  equipmentIds: string[];
  gpsAccuracy?: number | null;
}

/** Auto-derived HIPO flag (V-24): high potential = severity band >= 4. */
export function computeHipo(potentialSev: number): boolean {
  return potentialSev >= 4;
}

export function validateIncidentSubmit(input: IncidentValidationInput): void {
  const errors: FieldError[] = [];

  // V-01
  if (input.incidentDt.getTime() > Date.now()) {
    errors.push({ field: 'incidentDt', code: 'V-01', message: 'Tanggal/waktu kejadian tidak boleh di masa depan.' });
  }

  // V-21 KB => kbSpecCode required
  if (input.regType === 'KB' && !input.kbSpecCode) {
    errors.push({ field: 'kbSpecCode', code: 'V-21', message: 'Kejadian Berbahaya wajib memiliki kode spesifikasi (kb_spec_code).' });
  }

  // V-22 KT => reg_class in {RINGAN,BERAT,MENINGGAL}
  if (input.regType === 'KT' && !['RINGAN', 'BERAT', 'MENINGGAL'].includes(input.regClass)) {
    errors.push({ field: 'regClass', code: 'V-22', message: 'Kecelakaan Tambang wajib diklasifikasikan RINGAN/BERAT/MENINGGAL.' });
  }

  // V-23 NA/PAK reg_class consistency
  if (input.regType === 'NA' && input.regClass !== 'NA') {
    errors.push({ field: 'regClass', code: 'V-23', message: 'reg_type NA harus memiliki reg_class NA.' });
  }
  if (input.regType === 'PAK' && input.regClass !== 'PAK') {
    errors.push({ field: 'regClass', code: 'V-23', message: 'reg_type PAK harus memiliki reg_class PAK.' });
  }

  // V-02 FAT => outcome MENINGGAL & reg_class MENINGGAL
  if (input.indClass === 'FAT') {
    if (input.regClass !== 'MENINGGAL') {
      errors.push({ field: 'regClass', code: 'V-02', message: 'Klasifikasi Fatality wajib reg_class MENINGGAL.' });
    }
    if (!input.victims.some((v) => v.outcome === 'MENINGGAL')) {
      errors.push({ field: 'victims', code: 'V-02', message: 'Fatality wajib memiliki korban dengan outcome MENINGGAL.' });
    }
  }

  // V-03 LTI => lost_days >= 1 per victim
  if (input.indClass === 'LTI' && !input.victims.every((v) => v.lostDays >= 1)) {
    errors.push({ field: 'victims', code: 'V-03', message: 'LTI wajib lost_days >= 1 untuk setiap korban.' });
  }

  // V-04 MTI/FAI => lost_days = 0
  if ((input.indClass === 'MTI' || input.indClass === 'FAI') && !input.victims.every((v) => v.lostDays === 0)) {
    errors.push({ field: 'victims', code: 'V-04', message: 'MTI/FAI wajib lost_days = 0.' });
  }

  // V-05 NM => tanpa korban
  if (input.indClass === 'NM' && input.victims.length > 0) {
    errors.push({ field: 'victims', code: 'V-05', message: 'Near Miss tidak boleh memiliki korban.' });
  }

  // V-06 lost_days >= 0
  if (!input.victims.every((v) => v.lostDays >= 0)) {
    errors.push({ field: 'victims', code: 'V-06', message: 'lost_days tidak boleh negatif.' });
  }

  // V-07 PD => equipment wajib
  if (input.mgmtCategory === 'PD' && input.equipmentIds.length === 0) {
    errors.push({ field: 'equipmentIds', code: 'V-07', message: 'Kerusakan properti wajib menautkan unit/peralatan.' });
  }

  // V-16 exp_m 0..11
  if (!input.victims.every((v) => v.expM >= 0 && v.expM <= 11)) {
    errors.push({ field: 'victims', code: 'V-16', message: 'Bulan pengalaman kerja (exp_m) harus 0..11.' });
  }

  // V-25 work_day_no >= 0; jika ada korban, workday_ref harus salah satu korban
  if (input.workDayNo !== undefined && input.workDayNo !== null && input.workDayNo < 0) {
    errors.push({ field: 'workDayNo', code: 'V-25', message: 'work_day_no tidak boleh negatif.' });
  }
  if (input.victims.length > 0 && input.workdayRefWorkerId && !input.victims.some((v) => v.workerId === input.workdayRefWorkerId)) {
    errors.push({ field: 'workdayRefWorkerId', code: 'V-25', message: 'workday_ref harus salah satu korban terdaftar.' });
  }

  // description minimum length per §3.2
  if (!input.description || input.description.trim().length < 50) {
    errors.push({ field: 'description', code: 'DESC_MIN', message: 'Kronologi wajib diisi minimal 50 karakter.' });
  }

  // V-28 gps accuracy <= 50m else flag (soft — recorded as warning, not blocking)
  // handled by caller via flagGpsAccuracy()

  if (errors.length > 0) throw new ValidationError(errors);
}

/** V-28: GPS accuracy flag (non-blocking — UI/consumer decides how to surface). */
export function flagGpsAccuracy(accuracyMeters?: number | null): boolean {
  return typeof accuracyMeters === 'number' && accuracyMeters > 50;
}

export interface CapaValidationInput {
  priority: 'P1' | 'P2' | 'P3';
  dueD: Date;
  createdAt: Date;
}

/** V-11: due date must be after creation and within priority ceiling (P1=7d, P2=30d, P3=90d). */
export function validateCapaDueDate(input: CapaValidationInput, ceilings: { P1: number; P2: number; P3: number }): void {
  const errors: FieldError[] = [];
  if (input.dueD.getTime() <= input.createdAt.getTime()) {
    errors.push({ field: 'dueD', code: 'V-11', message: 'Tenggat CAPA harus setelah tanggal dibuat.' });
  }
  const maxDays = ceilings[input.priority];
  const maxDate = new Date(input.createdAt.getTime() + maxDays * 86400000);
  if (input.dueD.getTime() > maxDate.getTime()) {
    errors.push({ field: 'dueD', code: 'V-11', message: `Tenggat ${input.priority} maksimal ${maxDays} hari sejak dibuat.` });
  }
  if (errors.length > 0) throw new ValidationError(errors);
}

/** V-12: verifier must not be the same person as the PIC. */
export function validateCapaVerifier(verifierWorkerId: string, picWorkerId: string): void {
  if (verifierWorkerId === picWorkerId) {
    throw new ValidationError([{ field: 'verifierId', code: 'V-12', message: 'Verifikator tidak boleh sama dengan PIC.' }]);
  }
}

/** V-20: closing a CAPA requires at least one evidence item. */
export function validateCapaClose(evidence: unknown[]): void {
  if (!Array.isArray(evidence) || evidence.length === 0) {
    throw new ValidationError([{ field: 'evidence', code: 'V-20', message: 'Penutupan CAPA wajib menyertakan bukti.' }]);
  }
}

/** V-26: man-hours variance > threshold vs. prior period requires an approver + note. */
export function validateManHoursVariance(current: number, previous: number | null, thresholdPct: number, approverId?: string | null, note?: string): void {
  if (previous === null || previous === 0) return;
  const variance = Math.abs((current - previous) / previous) * 100;
  if (variance > thresholdPct && (!approverId || !note)) {
    throw new ValidationError([
      { field: 'approverId', code: 'V-26', message: `Varians jam kerja ${variance.toFixed(1)}% > ${thresholdPct}% wajib disetujui dengan catatan.` }
    ]);
  }
}

/** V-15: duplicate warning window (soft check — returns boolean, does not throw). */
export const DUPLICATE_WINDOW_HOURS = 24;
