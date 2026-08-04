import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiError } from '@/lib/api-helpers';
import { finalizeInvestigation, TransitionError } from '@/lib/state-machine';
import { db } from '@/lib/db';

/** §11 Endpoint kritis: POST /api/v1/incidents/{id}/approve — PJO Final sign-off. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return apiError('AUTH_401', 'Unauthenticated', 401);

  const incident = await db.incident.findUnique({ where: { id: params.id }, include: { investigation: true } });
  if (!incident) return apiError('NOT_404', 'Incident not found', 404);
  if (!incident.investigation) return apiError('CONF_409', 'Investigation not started', 409);

  const body = await req.json().catch(() => ({}));
  try {
    await finalizeInvestigation(incident.investigation.id, Boolean(body.otpConfirmed), session.user.id, session.user.role);
    return NextResponse.json({ status: 'FINAL' });
  } catch (e: any) {
    if (e instanceof TransitionError) return apiError(e.code, e.message, e.code === 'AUTH_403' ? 403 : e.code === 'AUTH_401' ? 401 : 409);
    return apiError('SYS_500', e?.message ?? 'Internal error', 500);
  }
}
