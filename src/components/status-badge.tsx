const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Disubmit',
  INVESTIGATING: 'Investigasi',
  REPORT_DRAFT: 'Draf Laporan',
  HSE_REVIEW: 'Review HSE',
  FINAL: 'Final',
  REPORTED: 'Terkirim',
  CLOSED: 'Ditutup',
  VOID: 'Dibatalkan',
  OPEN: 'Terbuka',
  IN_PROGRESS: 'Diproses',
  AWAITING_VERIFICATION: 'Menunggu Verifikasi',
  REOPENED: 'Dibuka Kembali',
  SCHEDULED: 'Terjadwal',
  DONE: 'Selesai',
  FOLLOW_UP: 'Tindak Lanjut',
  NEW: 'Baru',
  ACKNOWLEDGED: 'Diterima',
  ACTIONED: 'Ditindaklanjuti'
};

const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'badge-graphite',
  SUBMITTED: 'badge-amber',
  INVESTIGATING: 'badge-amber',
  REPORT_DRAFT: 'badge-amber',
  HSE_REVIEW: 'badge-amber',
  FINAL: 'badge-brass',
  REPORTED: 'badge-mineral',
  CLOSED: 'badge-mineral',
  VOID: 'badge-signal',
  OPEN: 'badge-graphite',
  IN_PROGRESS: 'badge-amber',
  AWAITING_VERIFICATION: 'badge-amber',
  REOPENED: 'badge-signal',
  SCHEDULED: 'badge-graphite',
  DONE: 'badge-mineral',
  FOLLOW_UP: 'badge-signal',
  NEW: 'badge-signal',
  ACKNOWLEDGED: 'badge-amber',
  ACTIONED: 'badge-mineral'
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge ${STATUS_COLOR[status] ?? 'badge-graphite'}`}>{STATUS_LABEL[status] ?? status}</span>;
}
