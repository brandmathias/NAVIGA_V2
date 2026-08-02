import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth-session';
import { getTaskBoard, saveTaskBoard, scopeForSession, TaskBoardConflictError } from '@/lib/task-board-repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function errorStatus(error: unknown) {
  if (error instanceof TaskBoardConflictError) return 409;
  if (error instanceof SyntaxError) return 400;
  if (error && typeof error === 'object' && 'status' in error && typeof error.status === 'number') return error.status;
  return 500;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Terjadi kesalahan saat menyimpan board tugas.';
}

async function getAuthorizedSession() {
  const session = await requireSession();
  return { session, scopeKey: scopeForSession(session) };
}

export async function GET() {
  try {
    const { session, scopeKey } = await getAuthorizedSession();
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'DATABASE_URL belum dikonfigurasi.' }, { status: 503 });
    }
    let result = await getTaskBoard(scopeKey, session);
    if (result.needsMigration && result.version > 0) {
      try {
        result = await saveTaskBoard(scopeKey, result.boardData, result.version, session);
      } catch (error) {
        if (!(error instanceof TaskBoardConflictError)) throw error;
        result = await getTaskBoard(scopeKey, session);
      }
    }
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: errorStatus(error) });
  }
}

export async function PUT(request: Request) {
  try {
    const { session, scopeKey } = await getAuthorizedSession();
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'DATABASE_URL belum dikonfigurasi.' }, { status: 503 });
    }
    const payload = await request.json();
    if (!Number.isInteger(payload?.version) || payload.version < 0) {
      return NextResponse.json({ error: 'Versi board tugas tidak valid.' }, { status: 400 });
    }

    const result = await saveTaskBoard(scopeKey, payload.boardData, payload.version, session);
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: errorStatus(error) });
  }
}
