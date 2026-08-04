'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Role } from '@prisma/client';
import { can } from '@/lib/rbac';
import {
  LayoutDashboard,
  AlertTriangle,
  ClipboardCheck,
  ListChecks,
  MessageSquareWarning,
  Database,
  ScrollText,
  ShieldCheck,
  Info
} from 'lucide-react';

const ITEMS: { href: string; label: string; icon: React.ElementType; module?: Parameters<typeof can>[1] }[] = [
  { href: '/home', label: 'Beranda', icon: LayoutDashboard },
  { href: '/incidents', label: 'Insiden', icon: AlertTriangle, module: 'incident' },
  { href: '/capa', label: 'CAPA', icon: ClipboardCheck, module: 'capa' },
  { href: '/inspections', label: 'Inspeksi / P2H', icon: ListChecks, module: 'inspection' },
  { href: '/proactive', label: 'Laporan Proaktif', icon: MessageSquareWarning, module: 'proactive' },
  { href: '/dashboard', label: 'Dasbor & KPI', icon: LayoutDashboard },
  { href: '/master-data', label: 'Master Data', icon: Database, module: 'master' },
  { href: '/regulatory', label: 'Pusat Regulasi', icon: ScrollText, module: 'regulatory' },
  { href: '/admin/audit', label: 'Audit & Admin', icon: ShieldCheck, module: 'admin' },
  { href: '/about', label: 'Tentang', icon: Info }
];

export function SidebarNav({ role }: { role: Role }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-graphite/10 bg-graphite text-porcelain md:flex">
      <div className="px-5 py-6">
        <div className="prisma-monogram text-lg font-bold tracking-widest">PA</div>
        <div className="text-xl font-semibold">PRISMA</div>
        <div className="mt-1 text-[11px] text-porcelain/50">v1.0 &quot;Adiyoga&quot;</div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {ITEMS.filter((item) => !item.module || can(role, item.module, 'read') || can(role, item.module, 'admin') || can(role, item.module, 'create')).map((item) => {
          const Icon = item.icon;
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-prisma px-3 py-2 text-sm transition-colors ${
                active ? 'bg-porcelain/10 text-porcelain' : 'text-porcelain/60 hover:bg-porcelain/5 hover:text-porcelain'
              }`}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-4 text-[10px] text-porcelain/30">
        System Owner: P. Adiyoga
      </div>
    </aside>
  );
}
