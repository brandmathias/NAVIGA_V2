import { NextResponse } from 'next/server';
import {
  authenticateLocalUser,
  createSessionToken,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from '@/lib/local-auth';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Data login tidak valid.' }, { status: 400 });
  }

  const credentials = body as { email?: unknown; password?: unknown };
  if (typeof credentials.email !== 'string' || typeof credentials.password !== 'string') {
    return NextResponse.json({ error: 'Email dan sandi wajib diisi.' }, { status: 400 });
  }

  const user = await authenticateLocalUser(credentials.email, credentials.password);
  if (!user) {
    return NextResponse.json({ error: 'Email atau sandi tidak valid.' }, { status: 401 });
  }

  const response = NextResponse.json({ user });
  response.cookies.set(SESSION_COOKIE_NAME, createSessionToken(user), sessionCookieOptions);
  return response;
}
