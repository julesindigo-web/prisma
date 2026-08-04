import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

export function apiError(code: string, msg: string, status: number, fields?: string[]) {
  return NextResponse.json({ error: { code, msg, fields: fields ?? [], trace_id: randomUUID() } }, { status });
}

export function parsePagination(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const pageSizeRaw = Number(searchParams.get('pageSize') ?? '20');
  const pageSize = Math.min(100, Math.max(1, pageSizeRaw || 20));
  return { skip: (page - 1) * pageSize, take: pageSize, page, pageSize };
}
