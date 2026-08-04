import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { apiError, parsePagination } from '@/lib/api-helpers';
import { isOwnScoped, isSiteScoped, can } from '@/lib/rbac';

/** §11 Endpoint kritis: GET /api/v1/incidents — paginated, RBAC-scoped list. */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return apiError('AUTH_401', 'Unauthenticated', 401);
  if (!can(session.user.role, 'incident', 'read')) return apiError('AUTH_403', 'Forbidden', 403);

  const { skip, take, page, pageSize } = parsePagination(req);

  const where: any = { status: { not: 'VOID' } };
  if (isOwnScoped(session.user.role)) {
    where.createdBy = session.user.id;
  } else if (isSiteScoped(session.user.role)) {
    const deployments = await db.workerDeployment.findMany({ where: { workerId: session.user.workerId, status: 'ACTIVE' } });
    where.siteId = { in: deployments.map((d) => d.siteId) };
  }

  const [items, total] = await Promise.all([
    db.incident.findMany({ where, orderBy: { incidentDt: 'desc' }, skip, take, include: { site: true, client: true } }),
    db.incident.count({ where })
  ]);

  return NextResponse.json({ data: items, page, pageSize, total });
}
