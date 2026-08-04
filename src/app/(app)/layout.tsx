import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SidebarNav } from '@/components/sidebar-nav';
import { TopBar } from '@/components/top-bar';
import { Footer } from '@/components/footer';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  return (
    <div className="flex min-h-screen bg-porcelain">
      <SidebarNav role={session.user.role} />
      <div className="flex min-h-screen flex-1 flex-col">
        <TopBar userName={session.user.name ?? ''} role={session.user.role} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
        <Footer variant="internal" />
      </div>
    </div>
  );
}
