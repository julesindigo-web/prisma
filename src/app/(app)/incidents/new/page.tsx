import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { IncidentWizard } from '@/components/incident-wizard';

export default async function NewIncidentPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const [clients, workers, equipment] = await Promise.all([
    db.client.findMany({
      where: { active: true },
      include: { sites: { where: { active: true }, include: { locations: { where: { active: true } } } } },
      orderBy: { name: 'asc' }
    }),
    db.worker.findMany({ where: { active: true }, orderBy: { name: 'asc' }, take: 500 }),
    db.equipment.findMany({ orderBy: { unitCode: 'asc' }, take: 500 })
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-1 text-xl font-semibold">Lapor Insiden Baru</h1>
      <p className="mb-6 text-sm text-graphite/60">Wizard 5 langkah — draf tersimpan otomatis di perangkat Anda.</p>
      <IncidentWizard clients={clients} workers={workers} equipment={equipment} />
    </div>
  );
}
