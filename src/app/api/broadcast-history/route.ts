import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth-session';
import {
  clearBroadcastHistory,
  listBroadcastHistory,
  saveBroadcastHistoryEntries,
  saveBroadcastHistoryEntry,
  type BroadcastHistoryInput,
} from '@/lib/broadcast-history-repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function errorStatus(error: unknown): number {
  if (error instanceof SyntaxError) return 400;
  if (error && typeof error === 'object' && 'status' in error && typeof error.status === 'number') return error.status;
  return 500;
}
function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Riwayat broadcast belum dapat diproses.';
}

const noStoreHeaders = { 'Cache-Control': 'private, no-store' };

export async function GET() {
  try {
    const session = await requireSession();
    const items = await listBroadcastHistory(session);
    return NextResponse.json({ items }, { headers: noStoreHeaders });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: errorStatus(error), headers: noStoreHeaders });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const payload = await request.json() as Partial<BroadcastHistoryInput> & { entries?: BroadcastHistoryInput[] };
    if (Array.isArray(payload.entries)) {
      const items = await saveBroadcastHistoryEntries(session, payload.entries);
      return NextResponse.json({ items }, { status: 201, headers: noStoreHeaders });
    }
    const item = await saveBroadcastHistoryEntry(session, payload as BroadcastHistoryInput);
    return NextResponse.json({ item }, { status: 201, headers: noStoreHeaders });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: errorStatus(error), headers: noStoreHeaders });
  }
}

export async function DELETE() {
  try {
    const session = await requireSession();
    await clearBroadcastHistory(session);
    return NextResponse.json({ ok: true }, { headers: noStoreHeaders });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: errorStatus(error), headers: noStoreHeaders });
  }
}
