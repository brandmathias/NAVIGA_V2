import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth, updateCurrentLoginNetwork } from '@/lib/auth.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || !session.session) return NextResponse.json({ error: 'Sesi login tidak valid atau telah berakhir.' }, { status: 401 });
    const context = await request.json();
    const updated = await updateCurrentLoginNetwork(session.user.id, session.session.id, context);
    if (!updated) return NextResponse.json({ error: 'Konteks jaringan tidak valid.' }, { status: 400 });
    return NextResponse.json({ updated: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Konteks jaringan belum dapat disimpan.' }, { status: 500 });
  }
}
