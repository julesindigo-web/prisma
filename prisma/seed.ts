import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { ulid } from 'ulid';

const db = new PrismaClient();

function id() {
  return ulid();
}

async function main() {
  console.log('Seeding PRISMA v1.0 "Adiyoga"…');

  // ── §0.2 SSOT Enum seeds (Lampiran A subset used by v1.0 modules) ──
  const enumSeeds: { groupKey: string; key: string; labelId: string; regulatory?: boolean }[] = [
    { groupKey: 'mgmt_category', key: 'INJ', labelId: 'Cedera' },
    { groupKey: 'mgmt_category', key: 'PD', labelId: 'Kerusakan properti' },
    { groupKey: 'mgmt_category', key: 'ENV', labelId: 'Lingkungan' },
    { groupKey: 'mgmt_category', key: 'PB', labelId: 'Proses bisnis' },
    { groupKey: 'mgmt_category', key: 'MECH', labelId: 'Mekanikal' },
    { groupKey: 'ind_class', key: 'NM', labelId: 'Near Miss', regulatory: true },
    { groupKey: 'ind_class', key: 'FAI', labelId: 'First Aid Injury', regulatory: true },
    { groupKey: 'ind_class', key: 'MTI', labelId: 'Medical Treatment Injury', regulatory: true },
    { groupKey: 'ind_class', key: 'RWTC', labelId: 'Restricted Work Case', regulatory: true },
    { groupKey: 'ind_class', key: 'LTI', labelId: 'Lost Time Injury', regulatory: true },
    { groupKey: 'ind_class', key: 'FAT', labelId: 'Fatality', regulatory: true },
    { groupKey: 'ind_class', key: 'PD', labelId: 'Kerusakan Properti', regulatory: true },
    { groupKey: 'reg_type', key: 'KT', labelId: 'Kecelakaan Tambang', regulatory: true },
    { groupKey: 'reg_type', key: 'KB', labelId: 'Kejadian Berbahaya', regulatory: true },
    { groupKey: 'reg_type', key: 'PAK', labelId: 'Penyakit Akibat Kerja', regulatory: true },
    { groupKey: 'reg_type', key: 'NA', labelId: 'Bukan kecelakaan tambang', regulatory: true },
    { groupKey: 'reg_class', key: 'RINGAN', labelId: 'Ringan', regulatory: true },
    { groupKey: 'reg_class', key: 'BERAT', labelId: 'Berat', regulatory: true },
    { groupKey: 'reg_class', key: 'MENINGGAL', labelId: 'Meninggal', regulatory: true },
    { groupKey: 'reg_class', key: 'NA', labelId: 'Tidak berlaku', regulatory: true },
    { groupKey: 'area_type', key: 'WORKSHOP', labelId: 'Workshop' },
    { groupKey: 'area_type', key: 'HAULROAD', labelId: 'Jalan angkut' },
    { groupKey: 'area_type', key: 'PARKIR', labelId: 'Parkir' },
    { groupKey: 'area_type', key: 'FRONT', labelId: 'Front tambang' },
    { groupKey: 'area_type', key: 'PLANT', labelId: 'Plant' },
    { groupKey: 'area_type', key: 'GUDANG', labelId: 'Gudang' },
    { groupKey: 'area_type', key: 'OFFICE', labelId: 'Kantor' },
    { groupKey: 'area_type', key: 'LAIN', labelId: 'Lain-lain' },
    { groupKey: 'emp_status', key: 'TETAP', labelId: 'Tetap' },
    { groupKey: 'emp_status', key: 'KONTRAK', labelId: 'Kontrak' },
    { groupKey: 'emp_status', key: 'HARIAN', labelId: 'Harian' },
    { groupKey: 'emp_status', key: 'MAGANG', labelId: 'Magang' },
    { groupKey: 'control_type', key: 'ELIM', labelId: 'Eliminasi' },
    { groupKey: 'control_type', key: 'SUB', labelId: 'Substitusi' },
    { groupKey: 'control_type', key: 'ENG', labelId: 'Rekayasa' },
    { groupKey: 'control_type', key: 'ADM', labelId: 'Administratif' },
    { groupKey: 'control_type', key: 'APD', labelId: 'Alat Pelindung Diri' },
    { groupKey: 'priority', key: 'P1', labelId: 'Prioritas 1 (7 hari)' },
    { groupKey: 'priority', key: 'P2', labelId: 'Prioritas 2 (30 hari)' },
    { groupKey: 'priority', key: 'P3', labelId: 'Prioritas 3 (90 hari)' }
  ];

  for (const e of enumSeeds) {
    await db.enumMaster.upsert({
      where: { groupKey_key_version: { groupKey: e.groupKey, key: e.key, version: 1 } },
      update: {},
      create: { id: id(), groupKey: e.groupKey, key: e.key, labelId: e.labelId, version: 1, regulatory: e.regulatory ?? false, status: 'ACTIVE' }
    });
  }

  // ── §2.1 RCL verified constants + §2.2 pending transcription queue ──
  const rclSeeds = [
    { key: 'INVESTIGATION_DEADLINE_HOURS', label: 'Tenggat penyelidikan kecelakaan/kejadian berbahaya', value: '48', citation: 'Lampiran Kepmen ESDM 1827 K/30/MEM/2018', status: 'VERIFIED' },
    { key: 'DISNAKER_REPORT_DEADLINE_HOURS', label: 'Tenggat lapor kecelakaan ke Disnaker setempat', value: '48', citation: 'Permenaker 03/MEN/1998', status: 'VERIFIED' },
    { key: 'ESCALATE_BEFORE_HOURS', label: 'Eskalasi sebelum tenggat', value: '6', citation: 'Konfigurasi internal §B', status: 'VERIFIED' },
    { key: 'HAZARD_RESPONSE_HOURS', label: 'Respons bahaya (hazard)', value: '24', citation: 'Konfigurasi internal §B', status: 'VERIFIED' },
    { key: 'CAPA_DUE_P1_DAYS', label: 'Tenggat CAPA Prioritas 1', value: '7', citation: 'Konfigurasi internal §B', status: 'VERIFIED' },
    { key: 'CAPA_DUE_P2_DAYS', label: 'Tenggat CAPA Prioritas 2', value: '30', citation: 'Konfigurasi internal §B', status: 'VERIFIED' },
    { key: 'CAPA_DUE_P3_DAYS', label: 'Tenggat CAPA Prioritas 3', value: '90', citation: 'Konfigurasi internal §B', status: 'VERIFIED' },
    { key: 'MANHOURS_VARIANCE_PCT', label: 'Ambang varians jam kerja', value: '20', citation: 'Konfigurasi internal §B', status: 'VERIFIED' },
    { key: 'HIPO_SEVERITY_THRESHOLD', label: 'Ambang keparahan HIPO', value: '4', citation: 'Konfigurasi internal §B', status: 'VERIFIED' },
    { key: 'RECURRENCE_WINDOW_HOURS', label: 'Jendela deteksi rekurensi CAPA', value: '2160', citation: 'Interpretasi §7 V-13 (90 hari) — ASUMSI, menunggu klarifikasi', status: 'PENDING_TRANSCRIPTION' },
    { key: 'KB_SPEC_LIST', label: 'Daftar spesifikasi Kejadian Berbahaya', value: 'PENDING', citation: 'Antrian Transkripsi §2.2 #1', status: 'PENDING_TRANSCRIPTION' },
    { key: 'RINGAN_BERAT_THRESHOLD_DAYS', label: 'Ambang hari Ringan vs Berat', value: 'PENDING', citation: 'Antrian Transkripsi §2.2 #2', status: 'PENDING_TRANSCRIPTION' },
    { key: 'LOST_DAYS_DEFINITION', label: 'Definisi hitung hari kerja hilang', value: 'PENDING', citation: 'Antrian Transkripsi §2.2 #3', status: 'PENDING_TRANSCRIPTION' }
  ];

  for (const r of rclSeeds) {
    await db.rclConstant.upsert({
      where: { key: r.key },
      update: {},
      create: { id: id(), key: r.key, label: r.label, value: r.value, citation: r.citation, status: r.status, verifier: r.status === 'VERIFIED' ? 'Priastama Adiyoga' : null, tglVerifikasi: r.status === 'VERIFIED' ? new Date() : null }
    });
  }

  // ── Demo master data ──
  const client = await db.client.upsert({
    where: { code: 'CLT-001' },
    update: {},
    create: { id: id(), code: 'CLT-001', name: 'PT Tambang Nusantara Jaya', iupNo: 'IUP-0001-2020', kttName: 'Ir. Bambang Wijaya' }
  });

  const client2 = await db.client.upsert({
    where: { code: 'CLT-002' },
    update: {},
    create: { id: id(), code: 'CLT-002', name: 'PT Sifang Mining Indonesia', iupNo: null, kttName: 'Zia Ulfadlah Idris' }
  });

  const site = await db.site.upsert({
    where: { clientId_code: { clientId: client.id, code: 'SITE-A' } },
    update: {},
    create: { id: id(), clientId: client.id, code: 'SITE-A', name: 'Site Alpha' }
  });

  const site2 = await db.site.upsert({
    where: { clientId_code: { clientId: client2.id, code: 'SITE-B' } },
    update: {},
    create: { id: id(), clientId: client2.id, code: 'SITE-B', name: 'Site Beta' }
  });

  const location = await db.location.create({
    data: { id: id(), siteId: site.id, name: 'Front Pit Alpha 1', areaType: 'FRONT' }
  });
  await db.location.create({ data: { id: id(), siteId: site.id, name: 'Workshop Utama', areaType: 'WORKSHOP' } });
  await db.location.create({ data: { id: id(), siteId: site2.id, name: 'Front Pit Beta', areaType: 'FRONT' } });
  await db.location.create({ data: { id: id(), siteId: site2.id, name: 'Workshop Beta', areaType: 'WORKSHOP' } });

  const equipment = await db.equipment.upsert({
    where: { unitCode: 'EX-001' },
    update: {},
    create: { id: id(), unitCode: 'EX-001', type: 'Excavator', make: 'Komatsu', model: 'PC2000' }
  });

  const inspectionTemplate = await db.inspectionTemplate.create({
    data: {
      id: id(),
      scope: 'EQUIPMENT',
      name: 'P2H Alat Berat Harian',
      version: 1,
      items: [
        { code: 'P2H-01', question: 'Kondisi ban/track layak jalan?', critical: true },
        { code: 'P2H-02', question: 'Level oli hidrolik normal?', critical: true },
        { code: 'P2H-03', question: 'Sistem rem berfungsi baik?', critical: true },
        { code: 'P2H-04', question: 'Lampu &amp; klakson berfungsi?', critical: false },
        { code: 'P2H-05', question: 'APAR tersedia &amp; belum expired?', critical: true }
      ]
    }
  });

  // ── Demo workers + one user account per role ──
  const roleSeeds: { role: string; name: string; nik: string; email: string }[] = [
    { role: 'SO', name: 'Priastama Adiyoga', nik: '0000000001', email: process.env.SEED_SO_EMAIL ?? 'so@prisma.local' },
    { role: 'HSE', name: 'Siti Rahma (HSE Officer)', nik: '0000000002', email: 'hse@prisma.local' },
    { role: 'PJO', name: 'Ir. Bambang Wijaya (PJO)', nik: '0000000003', email: 'pjo@prisma.local' },
    { role: 'PENGAWAS', name: 'Andi Kurniawan (Pengawas)', nik: '0000000004', email: 'pengawas@prisma.local' },
    { role: 'PEKERJA', name: 'Joko Santoso (Pekerja)', nik: '0000000005', email: 'pekerja@prisma.local' },
    { role: 'MGMT', name: 'Dewi Lestari (Manajemen)', nik: '0000000006', email: 'mgmt@prisma.local' },
    { role: 'AUD', name: 'Rudi Hartono (Auditor)', nik: '0000000007', email: 'audit@prisma.local' }
  ];

  const defaultPassword = process.env.SEED_SO_PASSWORD ?? '123';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  for (const r of roleSeeds) {
    const worker = await db.worker.upsert({
      where: { nik: r.nik },
      update: {},
      create: { id: id(), nik: r.nik, name: r.name, empStatus: 'TETAP', active: true }
    });
    await db.workerDeployment.create({
      data: { id: id(), workerId: worker.id, clientId: client.id, siteId: site.id, startD: new Date(), status: 'ACTIVE', roleAtSite: r.role }
    });
    await db.userAccount.upsert({
      where: { email: r.email },
      update: {},
      create: { id: id(), workerId: worker.id, email: r.email, passwordHash, role: r.role as any }
    });
  }

  console.log('Seed selesai.');
  console.log(`Login System Owner: ${process.env.SEED_SO_EMAIL ?? 'so@prisma.local'} / ${defaultPassword}`);
  console.log('Akun demo lain: hse@, pjo@, pengawas@, pekerja@, mgmt@, audit@prisma.local (kata sandi sama).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
