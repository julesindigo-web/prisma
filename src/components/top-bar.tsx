'use client';

import { signOut } from 'next-auth/react';
import type { Role } from '@prisma/client';
import { LogOut } from 'lucide-react';

const ROLE_LABEL: Record<Role, string> = {
  PEKERJA: 'Pekerja',
  PENGAWAS: 'Pengawas',
  HSE: 'HSE',
  PJO: 'Penanggung Jawab Operasional',
  MGMT: 'Manajemen',
  SO: 'System Owner',
  AUD: 'Auditor'
};

export function TopBar({ userName, role }: { userName: string; role: Role }) {
  return (
    <header className="flex items-center justify-between border-b border-graphite/10 bg-white px-4 py-3 md:px-6">
      <div className="text-sm text-graphite/60">
        <span className="badge badge-mineral">{ROLE_LABEL[role]}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">{userName}</span>
        <button onClick={() => signOut({ callbackUrl: '/login' })} className="btn-secondary !px-2 !py-1" title="Keluar">
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
