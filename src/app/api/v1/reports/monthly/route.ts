import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { apiError } from '@/lib/api-helpers';
import { can } from '@/lib/rbac';

/** §11 Endpoint kritis: GET /api/v1/reports/monthly?period=YYYY-MM */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return apiError('AUTH_401', 'Unauthenticated', 401);
  if (!can(session.user.role, 'regulatory', 'export') && !can(session.user.role, 'regulatory', 'admin')) {
    return apiError('AUTH_403', 'Forbidden', 403);
  }

  const period = new URL(req.url).searchParams.get('period');
  if (!period) return apiError('VAL_422', 'period is required (YYYY-MM)', 422, ['period']);

  const reports = await db.regReport.findMany({ where: { period, kind: 'BULANAN_1806' }, include: { client: true } });
  return NextResponse.json({ data: reports });
}
