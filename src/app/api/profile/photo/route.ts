import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth, getProfilePhoto, saveProfilePhoto } from '@/lib/auth.mjs';
import { MAX_PROFILE_PHOTO_SIZE, validateProfilePhoto } from '@/lib/profile-photo-storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function currentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Foto profil belum dapat diproses.';
}

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Sesi login tidak valid atau telah berakhir.' }, { status: 401 });
    const photo = await getProfilePhoto(user.id);
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

export async function PUT(request: Request) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Sesi login tidak valid atau telah berakhir.' }, { status: 401 });

    const contentLength = Number(request.headers.get('content-length') ?? 0);
    if (contentLength > MAX_PROFILE_PHOTO_SIZE + 64 * 1024) {
      return NextResponse.json({ error: 'Ukuran foto maksimal 5 MB.' }, { status: 400 });
    }

    const form = await request.formData();
    const photo = form.get('photo');
    if (!(photo instanceof File)) return NextResponse.json({ error: 'Pilih foto profil terlebih dahulu.' }, { status: 400 });

    const validationError = validateProfilePhoto(photo);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

    await saveProfilePhoto(user.id, photo.type, Buffer.from(await photo.arrayBuffer()));
    return NextResponse.json({ updatedAt: new Date().toISOString() }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
