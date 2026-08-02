import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth, authPool, getProfilePhoto } from '@/lib/auth.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type PhotoUser = {
  id: string;
  role?: string | null;
  unitId?: string | null;
};

async function getUserForPhoto(userId: string): Promise<PhotoUser | null> {
  const result = await authPool.query('SELECT id, role, "unitId" FROM "user" WHERE id = $1', [userId]);
  return result.rows[0] ?? null;
}

function canViewPhoto(viewer: PhotoUser, target: PhotoUser) {
  if (viewer.id === target.id) return true;
  return viewer.role === 'unit' && target.role === 'unit' && Boolean(viewer.unitId) && viewer.unitId === target.unitId;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Foto profil belum dapat diproses.';
}

export async function GET(_request: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const viewer = session?.user as PhotoUser | undefined;
    if (!viewer?.id) return NextResponse.json({ error: 'Sesi login tidak valid atau telah berakhir.' }, { status: 401 });

    const { userId } = await params;
    const targetUserId = String(userId ?? '').trim();
    if (!targetUserId) return NextResponse.json({ error: 'Akun tidak valid.' }, { status: 400 });

    const target = viewer.id === targetUserId ? viewer : await getUserForPhoto(targetUserId);
    if (!target) return NextResponse.json({ error: 'Akun tidak ditemukan.' }, { status: 404 });
    if (!canViewPhoto(viewer, target)) return NextResponse.json({ error: 'Anda tidak dapat melihat foto profil akun ini.' }, { status: 403 });

    const photo = await getProfilePhoto(targetUserId);
    if (!photo) return NextResponse.json({ error: 'Foto profil belum tersedia.' }, { status: 404 });

    return new NextResponse(photo.photo_bytes, {
      headers: {
        'Content-Type': photo.mime_type,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
