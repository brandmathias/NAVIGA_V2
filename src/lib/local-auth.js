const { createHmac, timingSafeEqual } = require('node:crypto');
const { authenticateAccount } = require('./unit-registry');

const SESSION_COOKIE_NAME = 'naviga_session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
// ponytail: a stable local-only fallback lets independently bundled dev routes verify one session.
const developmentSessionSecret = 'naviga-local-demo-session-secret-v1';

function getSessionSecret() {
  const configuredSecret = process.env.NAVIGA_SESSION_SECRET;
  if (configuredSecret) return configuredSecret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('NAVIGA_SESSION_SECRET wajib diatur pada production.');
  }
  return developmentSessionSecret;
}

function hasSameValue(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function sign(payload) {
  return createHmac('sha256', getSessionSecret()).update(payload).digest('base64url');
}

function parseSession(payload) {
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (
      !session ||
      typeof session.name !== 'string' ||
      typeof session.email !== 'string' ||
      (session.role !== 'superadmin' && session.role !== 'unit') ||
      (session.unitId !== null && typeof session.unitId !== 'string') ||
      (session.unitName !== null && typeof session.unitName !== 'string') ||
      (session.unitPrefix !== null && !/^\d{5}$/.test(session.unitPrefix)) ||
      (session.unitCode !== null && session.unitCode !== undefined && typeof session.unitCode !== 'string') ||
      (session.unitDomicile !== null && session.unitDomicile !== undefined && typeof session.unitDomicile !== 'string') ||
      (session.unitProvince !== null && session.unitProvince !== undefined && typeof session.unitProvince !== 'string') ||
      (session.unitPhone !== null && session.unitPhone !== undefined && typeof session.unitPhone !== 'string') ||
      (session.unitAddress !== null && session.unitAddress !== undefined && typeof session.unitAddress !== 'string') ||
      typeof session.upc !== 'string' ||
      typeof session.expiresAt !== 'number' ||
      !Number.isFinite(session.expiresAt)
    ) {
      return null;
    }

    return {
      name: session.name,
      email: session.email,
      role: session.role,
      unitId: session.unitId,
      unitName: session.unitName,
      unitPrefix: session.unitPrefix,
      unitCode: session.unitCode ?? null,
      unitDomicile: session.unitDomicile ?? null,
      unitProvince: session.unitProvince ?? null,
      unitPhone: session.unitPhone ?? null,
      unitAddress: session.unitAddress ?? null,
      upc: session.upc,
      expiresAt: session.expiresAt,
    };
  } catch {
    return null;
  }
}

async function authenticateLocalUser(email, password) {
  if (typeof email !== 'string' || typeof password !== 'string') return null;
  return authenticateAccount(email, password);
}

function createSessionToken(user, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ ...user, expiresAt: now + SESSION_TTL_MS })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function verifySessionToken(token, now = Date.now()) {
  if (!token) return null;

  const separator = token.lastIndexOf('.');
  if (separator <= 0 || separator === token.length - 1) return null;

  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  if (!hasSameValue(sign(payload), signature)) return null;

  const session = parseSession(payload);
  return session && session.expiresAt > now ? session : null;
}

const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: SESSION_TTL_MS / 1000,
};

class LocalAuthError extends Error {
  constructor() {
    super('Unauthorized');
    this.status = 401;
  }
}

async function getSession() {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

async function requireSession() {
  const session = await getSession();
  if (!session) throw new LocalAuthError();
  return session;
}

module.exports = {
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
  LocalAuthError,
  authenticateLocalUser,
  createSessionToken,
  getSession,
  requireSession,
  sessionCookieOptions,
  verifySessionToken,
};
