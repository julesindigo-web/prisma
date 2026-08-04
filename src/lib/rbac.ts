import { Role } from '@prisma/client';

export type Action = 'create' | 'read' | 'update' | 'void' | 'approve' | 'export' | 'admin';
export type Module =
  | 'incident'
  | 'investigation'
  | 'capa'
  | 'inspection'
  | 'proactive'
  | 'master'
  | 'regulatory'
  | 'admin';

/**
 * §6 ROLE & IZIN — module x role permission matrix.
 * Scope qualifiers (own/site) are enforced separately at the query layer (see scopeFilter()).
 */
const MATRIX: Record<Module, Partial<Record<Role, Action[]>>> = {
  incident: {
    PEKERJA: ['create', 'read'],
    PENGAWAS: ['create', 'read'],
    HSE: ['create', 'read', 'update', 'void'],
    PJO: ['read', 'approve'],
    MGMT: ['read'],
    SO: ['create', 'read', 'update', 'void'],
    AUD: ['read']
  },
  investigation: {
    PENGAWAS: ['read'],
    HSE: ['create', 'read', 'update'],
    PJO: ['approve'],
    MGMT: ['read'],
    SO: ['create', 'read', 'update'],
    AUD: ['read']
  },
  capa: {
    PEKERJA: ['read'],
    PENGAWAS: ['create', 'read', 'update'],
    HSE: ['create', 'read', 'update'],
    PJO: ['approve'],
    MGMT: ['read'],
    SO: ['create', 'read', 'update'],
    AUD: ['read']
  },
  inspection: {
    PEKERJA: ['create', 'read'],
    PENGAWAS: ['create', 'read', 'update'],
    HSE: ['create', 'read', 'update'],
    PJO: ['read'],
    MGMT: ['read'],
    SO: ['create', 'read', 'update'],
    AUD: ['read']
  },
  proactive: {
    PEKERJA: ['create'],
    PENGAWAS: ['read', 'update'],
    HSE: ['create', 'read', 'update'],
    PJO: ['read'],
    MGMT: ['read'],
    SO: ['create', 'read', 'update'],
    AUD: ['read']
  },
  master: {
    PEKERJA: ['read'],
    PENGAWAS: ['read'],
    HSE: ['create', 'update', 'read'],
    SO: ['admin'],
    AUD: ['read']
  },
  regulatory: {
    HSE: ['create', 'update'],
    PJO: ['approve'],
    MGMT: ['read'],
    SO: ['admin', 'export'],
    AUD: ['read']
  },
  admin: {
    HSE: ['read'],
    SO: ['admin'],
    AUD: ['read']
  }
};

export function can(role: Role, module: Module, action: Action): boolean {
  const allowed = MATRIX[module]?.[role];
  if (!allowed) return false;
  if (allowed.includes(action)) return true;
  // ADM implies full control over its own module
  if (allowed.includes('admin')) return true;
  return false;
}

export function assertCan(role: Role, module: Module, action: Action) {
  if (!can(role, module, action)) {
    const err = new Error(`RBAC: role ${role} cannot ${action} on ${module}`) as Error & { code: string };
    err.code = 'AUTH_403';
    throw err;
  }
}

/** True for roles that must be scoped to "own site(s)" rather than seeing all sites. */
export function isSiteScoped(role: Role): boolean {
  return role === 'PEKERJA' || role === 'PENGAWAS' || role === 'HSE';
}

/** True for roles whose incident visibility is restricted to records they authored. */
export function isOwnScoped(role: Role): boolean {
  return role === 'PEKERJA';
}
