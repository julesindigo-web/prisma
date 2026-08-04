import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { apiError, parsePagination } from '@/lib/api-helpers';
import { can } from '@/lib/rbac';

/** §11 Endpoint kritis: GET /api/v1/audit — immutable audit trail (AUD/SO/HSE read access). */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return apiError('AUTH_401', 'Unauthenticated', 401);
  if (!can(session.user.role, 'admin', 'read')) return apiError('AUTH_403', 'Forbidden', 403);

  const { skip, take, page, pageSize } = parsePagination(req);
  const [items, total] = await Promise.all([
    db.auditEvent.findMany({ orderBy: { ts: 'desc' }, skip, take }),
    db.auditEvent.count()
  ]);

  return NextResponse.json({ data: items, page, pageSize, total });
}
