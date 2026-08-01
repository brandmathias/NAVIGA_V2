import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth, listLoginHistory } from '@/lib/auth.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: 'Sesi login tidak valid atau telah berakhir.' }, { status: 401 });
    const items = await listLoginHistory(session.user.id);
    return NextResponse.json({ items }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Riwayat login belum dapat dimuat.' }, { status: 500 });
  }
}
