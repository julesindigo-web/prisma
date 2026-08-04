# PRISMA Safety Management System — v1.0 "Adiyoga"

> "Keselamatan, terlihat menyeluruh." — dikonsep & dirancang oleh **Priastama Adiyoga**

Implementasi kerja (production-ready) dari **PRISMA Safety Management System Blueprint v3.0 CANONICAL**,
mencakup scope **v1.0 "Adiyoga"** persis seperti didefinisikan pada roadmap blueprint §14:
**M1–M7, M15–M19** — Master Data, Auth/RBAC/Audit, Pelaporan Insiden, Investigasi & RCA (SCAT), CAPA,
Inspeksi/P2H, Laporan Proaktif, Pusat Regulasi, Dasbor & KPI (FR/SR), SLA Engine, dan Branding Layer.

## Cakupan & Keputusan Scope

Blueprint v3.0 memfaset rilisnya sendiri menjadi 3 tahap (§14):
- **v1.0 "Adiyoga"** (dibangun di repo ini): M1–M7, M15–M19
- **v1.1 "Manggala"** (belum dibangun): M8 PTW/JSA/TBT, M9 Kompetensi/Induksi, M10 CSMS, M11 Kesehatan/Fatigue, M12 Kedaruratan/ERP, M14 Policy Hub
- **v1.2** (belum dibangun): M13 Risk Register penuh, M21 Predictive/AI RCA, integrasi IoT

Ini **bukan pengurangan cakupan** — ini adalah realisasi tahap pertama sesuai roadmap yang didefinisikan blueprint itu sendiri. Skema data (Prisma) hanya memodelkan entitas yang benar-benar didukung logikanya pada tahap ini, agar tidak ada kode/tabel menganggur.

### Validasi (§7) yang diberlakukan di v1.0
V-01, V-02, V-03, V-04, V-05, V-06, V-07, V-08 (soft), V-09 (soft), V-11, V-12, V-13 (interpretasi jendela 90 hari, ditandai `PENDING_TRANSCRIPTION` di RCL — lihat catatan di bawah), V-15 (soft/duplicate-warning belum di-UI-kan), V-16, V-20, V-21, V-22, V-23, V-24 (auto), V-25, V-26, V-27 (di lapisan upload — belum diimplementasi penuh), V-28, V-30.
**Tidak diberlakukan** (terikat modul v1.1/v1.2): V-10 (sertifikasi ketua tim), V-14 (fatigue), V-17 (induksi), V-18 (MCU), V-19 (sertifikasi umum), V-29 (GPS drift).

### Catatan Transkripsi Regulasi (§2.2)
Beberapa konstanta regulasi dalam blueprint belum memiliki kutipan verbatim (KB spec list, ambang Ringan/Berat, definisi hari kerja hilang). Nilai-nilai ini di-seed dengan status `PENDING_TRANSCRIPTION` di tabel `RclConstant` — sesuai doktrin §0.2, sistem akan menolak (RCL_423) penggunaan nilai ini di **production** sampai diverifikasi oleh System Owner dan diberi kutipan JDIH resmi. Ini adalah pagar pengaman yang disengaja, bukan bug.

## Tumpukan Teknologi
- **Next.js 14** (App Router, Server Actions) + TypeScript
- **PostgreSQL** via **Prisma ORM**
- **NextAuth (Credentials + JWT)** untuk autentikasi berbasis peran
- **Tailwind CSS** — design system sesuai §1.3 blueprint (graphite/porcelain/brass/mineral/signal/amber)
- Deploy target: **Vercel** + PostgreSQL terkelola (Neon / Vercel Postgres / Supabase)

## Menjalankan Secara Lokal

1. Siapkan PostgreSQL (lokal atau cloud) dan salin `.env.example` menjadi `.env`, isi `DATABASE_URL`.
2. Install dependency:
   ```bash
   npm install
   ```
3. Terapkan migrasi database:
   ```bash
   npm run prisma:deploy
   ```
4. Isi data awal (enum master, RCL, demo client/site/pekerja/akun):
   ```bash
   npm run prisma:seed
   ```
5. Jalankan server pengembangan:
   ```bash
   npm run dev
   ```
6. Login dengan akun demo (kata sandi default `ChangeMe123!`, ganti `SEED_SO_PASSWORD` sebelum seed produksi):
   - `so@prisma.local` — System Owner (akses penuh)
   - `hse@prisma.local` — HSE
   - `pjo@prisma.local` — Penanggung Jawab Operasional
   - `pengawas@prisma.local` — Pengawas
   - `pekerja@prisma.local` — Pekerja
   - `mgmt@prisma.local` — Manajemen (read-only)
   - `audit@prisma.local` — Auditor (read-only)

## Deploy ke Vercel

1. Push repo ini ke GitHub/GitLab/Bitbucket.
2. Buat proyek PostgreSQL terkelola (disarankan **Vercel Postgres** atau **Neon**) dan salin connection string-nya.
3. Import repo di [vercel.com/new](https://vercel.com/new).
4. Set Environment Variables di Vercel:
   - `DATABASE_URL` — connection string PostgreSQL (gunakan mode `?sslmode=require` bila diperlukan)
   - `NEXTAUTH_SECRET` — string acak panjang (`openssl rand -base64 32`)
   - `NEXTAUTH_URL` — URL domain Vercel Anda (mis. `https://prisma-smk.vercel.app`)
5. Deploy. Vercel otomatis menjalankan skrip `vercel-build` (`prisma generate && prisma migrate deploy && next build`) sehingga migrasi database diterapkan setiap deploy.
6. Setelah deploy pertama, jalankan seed sekali dari mesin lokal Anda yang menunjuk ke `DATABASE_URL` produksi:
   ```bash
   npm run prisma:seed
   ```

`vercel.json` sudah disertakan dengan `buildCommand: npm run vercel-build`.

## Struktur Proyek

```
prisma/
  schema.prisma        # Model data (§3 domain model, scope v1.0)
  seed.ts               # Enum master, RCL, demo data, akun per peran
  migrations/           # Migrasi SQL siap pakai (prisma migrate deploy)
src/
  lib/                  # Inti non-UI: db, auth, rbac, validation (V-01..V-30), state-machine (§5), kpi (§9), rcl, audit, ids
  app/
    actions/             # Server Actions (mutasi + guard RBAC + audit)
    api/v1/              # Endpoint REST kritis (§11): incidents, approve, audit, reports/monthly
    (app)/               # Shell terautentikasi: home, incidents, investigations, capa, inspections, proactive, dashboard, master-data, regulatory, admin/audit, about
    login/
  components/            # UI: wizard insiden, aksi tahap CAPA/inspeksi/investigasi/proaktif, sidebar, badge status
```

## Yang Belum Diimplementasikan (secara sadar, sesuai fase roadmap blueprint)
- Modul v1.1/v1.2: PTW/JSA/TBT, Kompetensi/Induksi, CSMS, Kesehatan/Fatigue, ERP/Drill, Risk Register penuh, Policy Hub, Predictive Risk/AI RCA, integrasi IoT.
- Offline-first penuh (IndexedDB + outbox + resolusi konflik otomatis) — draf insiden saat ini di-autosave ke `localStorage`, bukan antrian sinkronisasi penuh.
- Upload berkas biner nyata (foto/video/dokumen bukti) — field evidence saat ini menerima referensi teks/URL; integrasi object storage (mis. Vercel Blob/S3) adalah langkah lanjutan yang jelas.
- Notifikasi WA/email nyata — saat ini dicatat ke tabel `NotificationLog` sebagai simulasi in-app.
- OTP pengesahan PJO nyata — saat ini disimulasikan sebagai konfirmasi checkbox/kode di form (integrasi SMS/OTP provider adalah langkah lanjutan).

## Catatan Keamanan
- `npm audit` melaporkan sejumlah advisory Next.js 14.2.x yang sebagian besar relevan untuk skenario custom-server/edge/i18n-routing yang tidak dipakai aplikasi ini; tetap disarankan memutakhirkan ke rilis Next.js terbaru yang stabil secara berkala.
- Kata sandi di-hash dengan bcrypt; ganti seluruh kata sandi demo sebelum produksi.
- Seluruh mutasi diverifikasi RBAC (§6) di lapisan server action sebelum menyentuh database.
- Audit log bersifat append-only (§0.2 doktrin #4) — tidak ada endpoint update/delete untuk `AuditEvent`.
