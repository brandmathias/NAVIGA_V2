import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth-session';
import { validateTaskBoardData } from '@/lib/task-board-validation.mjs';
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

async function getAuthorizedScope() {
  const session = await requireSession();
  return scopeForSession(session);
}

export async function GET() {
  try {
    const scopeKey = await getAuthorizedScope();
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'DATABASE_URL belum dikonfigurasi.' }, { status: 503 });
    }
    const result = await getTaskBoard(scopeKey);
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: errorStatus(error) });
  }
}

export async function PUT(request: Request) {
  try {
    const scopeKey = await getAuthorizedScope();
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'DATABASE_URL belum dikonfigurasi.' }, { status: 503 });
    }
    const payload = await request.json();
    const validation = validateTaskBoardData(payload?.boardData);
    if (!validation.valid || !Number.isInteger(payload?.version) || payload.version < 0) {
      const validationMessage = 'message' in validation ? validation.message : 'Versi board tugas tidak valid.';
      return NextResponse.json({ error: validationMessage }, { status: 400 });
    }

    const result = await saveTaskBoard(scopeKey, payload.boardData, payload.version);
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: errorStatus(error) });
  }
}
