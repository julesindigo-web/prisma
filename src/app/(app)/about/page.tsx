export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="prisma-card p-8 text-center">
        <div className="prisma-monogram mb-2 text-4xl font-bold tracking-widest">PA</div>
        <h1 className="text-2xl font-semibold">PRISMA</h1>
        <p className="mt-1 text-sm text-graphite/60">Safety Management System — v1.0 &quot;Adiyoga&quot;</p>
        <p className="mt-4 text-lg prisma-signature">&ldquo;Keselamatan, terlihat menyeluruh.&rdquo;</p>

        <div className="mx-auto my-8 h-px w-24 bg-brass/40" />

        <p className="text-sm text-graphite/70">
          PRISMA dikonsep &amp; dirancang oleh
        </p>
        <p className="prisma-signature text-xl">Priastama Adiyoga</p>
        <p className="mt-1 text-xs text-graphite/50">System Owner &amp; Perancang Sistem</p>

        <div className="mt-8 rounded-prisma bg-graphite/5 p-4 text-left text-sm text-graphite/70">
          <p>
            PRISMA dibangun untuk memberi keterlihatan menyeluruh atas kinerja keselamatan pertambangan —
            dari pelaporan insiden, investigasi SCAT, tindak lanjut CAPA, inspeksi, hingga kepatuhan pelaporan
            regulator — dalam satu sistem tunggal yang terkendali, dapat diaudit, dan tidak pernah kehilangan jejak.
          </p>
        </div>

        <p className="mt-6 text-xs text-graphite/40">Sponsor: Manajemen [NAMA_PERUSAHAAN]</p>
      </div>
    </div>
  );
}
