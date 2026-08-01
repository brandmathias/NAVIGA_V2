import { betterAuth } from 'better-auth';
import { admin } from 'better-auth/plugins';
import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL?.trim();
const secret = process.env.BETTER_AUTH_SECRET?.trim();

if (!databaseUrl) throw new Error('DATABASE_URL belum dikonfigurasi.');
if (!secret || secret.length < 32) throw new Error('BETTER_AUTH_SECRET harus berisi minimal 32 karakter.');

const globalForAuth = globalThis;
export const authPool = globalForAuth.__navigaBetterAuthPool ?? new Pool({ connectionString: databaseUrl });
if (process.env.NODE_ENV !== 'production') globalForAuth.__navigaBetterAuthPool = authPool;

const accountSchemaReady = new WeakMap();
const CREATE_ACCOUNT_SCHEMA = `
  CREATE TABLE IF NOT EXISTS naviga_profile_photos (
    user_id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
    mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
    photo_bytes BYTEA NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS naviga_login_history (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL UNIQUE,
    logged_in_at TIMESTAMPTZ NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    browser TEXT NOT NULL,
    device TEXT NOT NULL,
    location TEXT,
    location_source TEXT NOT NULL DEFAULT 'network',
    location_accuracy_meters DOUBLE PRECISION,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION
  );
  ALTER TABLE naviga_login_history ADD COLUMN IF NOT EXISTS location TEXT;
  ALTER TABLE naviga_login_history ADD COLUMN IF NOT EXISTS location_source TEXT NOT NULL DEFAULT 'network';
  ALTER TABLE naviga_login_history ADD COLUMN IF NOT EXISTS location_accuracy_meters DOUBLE PRECISION;
  ALTER TABLE naviga_login_history ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
  ALTER TABLE naviga_login_history ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
  CREATE INDEX IF NOT EXISTS naviga_login_history_user_time_idx
    ON naviga_login_history (user_id, logged_in_at DESC);
`;

export async function ensureAccountDataSchema() {
  const cached = accountSchemaReady.get(authPool);
  if (cached) return cached;
  const promise = authPool.query(CREATE_ACCOUNT_SCHEMA).then(() => undefined).catch((error) => {
    accountSchemaReady.delete(authPool);
    throw error;
  });
  accountSchemaReady.set(authPool, promise);
  return promise;
}

function browserFromUserAgent(userAgent) {
  if (/edg\//i.test(userAgent)) return 'Microsoft Edge';
  if (/opr\//i.test(userAgent)) return 'Opera';
  if (/firefox\//i.test(userAgent)) return 'Mozilla Firefox';
  if (/chrome\//i.test(userAgent) && !/edg\//i.test(userAgent)) return 'Google Chrome';
  if (/safari\//i.test(userAgent)) return 'Safari';
  return 'Browser tidak dikenal';
}

function deviceFromUserAgent(userAgent) {
  if (/ipad/i.test(userAgent)) return 'iPad';
  if (/iphone/i.test(userAgent)) return 'iPhone';
  if (/android/i.test(userAgent)) return /mobile/i.test(userAgent) ? 'Android (ponsel)' : 'Android (tablet)';
  if (/windows nt/i.test(userAgent)) return 'Windows';
  if (/macintosh|mac os x/i.test(userAgent)) return 'macOS';
  if (/linux/i.test(userAgent)) return 'Linux';
  return 'Perangkat tidak dikenal';
}

function normalizeIpAddress(value) {
  const ipAddress = String(value ?? '').trim();
  return ipAddress || '127.0.0.1';
}

function networkLocationFromIp(ipAddress) {
  if (ipAddress === '127.0.0.1' || ipAddress === '::1' || /^10\./.test(ipAddress) || /^192\.168\./.test(ipAddress) || /^172\.(1[6-9]|2\d|3[01])\./.test(ipAddress)) {
    return 'Lingkungan lokal';
  }
  return 'Lokasi jaringan belum tersedia';
}

async function recordLogin(session) {
  if (!session?.id || !session?.userId) return;
  await ensureAccountDataSchema();
  const userAgent = String(session.userAgent ?? '');
  const ipAddress = normalizeIpAddress(session.ipAddress);
  await authPool.query(`
    INSERT INTO naviga_login_history (user_id, session_id, logged_in_at, ip_address, user_agent, browser, device, location)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (session_id) DO NOTHING
  `, [
    session.userId,
    session.id,
    session.createdAt ?? new Date(),
    ipAddress,
    userAgent || null,
    browserFromUserAgent(userAgent),
    deviceFromUserAgent(userAgent),
    networkLocationFromIp(ipAddress),
  ]);
}

export async function getProfilePhoto(userId) {
  await ensureAccountDataSchema();
  const result = await authPool.query(
    'SELECT mime_type, photo_bytes, updated_at FROM naviga_profile_photos WHERE user_id = $1',
    [userId],
  );
  return result.rows[0] ?? null;
}

export async function saveProfilePhoto(userId, mimeType, photoBytes) {
  await ensureAccountDataSchema();
  await authPool.query(`
    INSERT INTO naviga_profile_photos (user_id, mime_type, photo_bytes)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id) DO UPDATE
      SET mime_type = EXCLUDED.mime_type, photo_bytes = EXCLUDED.photo_bytes, updated_at = NOW()
  `, [userId, mimeType, photoBytes]);
}

export async function listLoginHistory(userId) {
  await ensureAccountDataSchema();
  await authPool.query(`
    INSERT INTO naviga_login_history (user_id, session_id, logged_in_at, ip_address, user_agent, browser, device, location)
    SELECT s."userId", s.id, s."createdAt", COALESCE(NULLIF(s."ipAddress", ''), '127.0.0.1'), s."userAgent",
      CASE
        WHEN s."userAgent" ~* 'edg/' THEN 'Microsoft Edge'
        WHEN s."userAgent" ~* 'opr/' THEN 'Opera'
        WHEN s."userAgent" ~* 'firefox/' THEN 'Mozilla Firefox'
        WHEN s."userAgent" ~* 'chrome/' THEN 'Google Chrome'
        WHEN s."userAgent" ~* 'safari/' THEN 'Safari'
        ELSE 'Browser tidak dikenal'
      END,
      CASE
        WHEN s."userAgent" ~* 'ipad' THEN 'iPad'
        WHEN s."userAgent" ~* 'iphone' THEN 'iPhone'
        WHEN s."userAgent" ~* 'android.*mobile' THEN 'Android (ponsel)'
        WHEN s."userAgent" ~* 'android' THEN 'Android (tablet)'
        WHEN s."userAgent" ~* 'windows nt' THEN 'Windows'
        WHEN s."userAgent" ~* 'macintosh|mac os x' THEN 'macOS'
        WHEN s."userAgent" ~* 'linux' THEN 'Linux'
        ELSE 'Perangkat tidak dikenal'
      END,
      CASE
        WHEN COALESCE(NULLIF(s."ipAddress", ''), '127.0.0.1') IN ('127.0.0.1', '::1') THEN 'Lingkungan lokal'
        WHEN COALESCE(NULLIF(s."ipAddress", ''), '127.0.0.1') ~ '^10\\.' THEN 'Lingkungan lokal'
        WHEN COALESCE(NULLIF(s."ipAddress", ''), '127.0.0.1') ~ '^192\\.168\\.' THEN 'Lingkungan lokal'
        WHEN COALESCE(NULLIF(s."ipAddress", ''), '127.0.0.1') ~ '^172\\.(1[6-9]|2[0-9]|3[0-1])\\.' THEN 'Lingkungan lokal'
        ELSE 'Lokasi jaringan belum tersedia'
      END
    FROM "session" s
    WHERE s."userId" = $1
    ON CONFLICT (session_id) DO NOTHING
  `, [userId]);
  const result = await authPool.query(`
    SELECT logged_in_at,
      COALESCE(NULLIF(ip_address, ''), '127.0.0.1') AS ip_address,
      browser,
      device,
      COALESCE(NULLIF(location, ''),
        CASE WHEN COALESCE(NULLIF(ip_address, ''), '127.0.0.1') IN ('127.0.0.1', '::1') THEN 'Lingkungan lokal'
        ELSE 'Lokasi jaringan belum tersedia' END
      ) AS location,
      COALESCE(NULLIF(location_source, ''), 'network') AS location_source,
      location_accuracy_meters
    FROM naviga_login_history
    WHERE user_id = $1
    ORDER BY logged_in_at DESC
    LIMIT 30
  `, [userId]);
  return result.rows.map((row) => ({
    loggedInAt: row.logged_in_at,
    ipAddress: row.ip_address,
    browser: row.browser,
    device: row.device,
    location: row.location,
    locationSource: row.location_source,
    locationAccuracyMeters: row.location_accuracy_meters === null ? null : Number(row.location_accuracy_meters),
  }));
}

export async function updateCurrentLoginNetwork(userId, sessionId, { ipAddress, city, region, country }) {
  const normalizedIp = String(ipAddress ?? '').trim();
  const location = [city, region, country]
    .map((value) => String(value ?? '').trim().slice(0, 80))
    .filter(Boolean)
    .join(', ');
  if (!/^((\d{1,3}\.){3}\d{1,3}|[0-9a-f:]+)$/i.test(normalizedIp) || !location) return false;

  await listLoginHistory(userId);
  const result = await authPool.query(`
    UPDATE naviga_login_history
    SET ip_address = $3,
      location = CASE WHEN location_source = 'device' THEN location ELSE $4 END,
      location_source = CASE WHEN location_source = 'device' THEN location_source ELSE 'network' END,
      location_accuracy_meters = CASE WHEN location_source = 'device' THEN location_accuracy_meters ELSE NULL END,
      latitude = CASE WHEN location_source = 'device' THEN latitude ELSE NULL END,
      longitude = CASE WHEN location_source = 'device' THEN longitude ELSE NULL END
    WHERE user_id = $1 AND session_id = $2
  `, [userId, sessionId, normalizedIp, location]);
  return result.rowCount === 1;
}

export async function updateCurrentLoginLocation(userId, sessionId, { latitude, longitude, accuracy, location }) {
  const normalizedLatitude = Number(latitude);
  const normalizedLongitude = Number(longitude);
  const normalizedAccuracy = Number(accuracy);
  const normalizedLocation = String(location ?? '').trim().slice(0, 500);
  if (!Number.isFinite(normalizedLatitude) || normalizedLatitude < -90 || normalizedLatitude > 90
    || !Number.isFinite(normalizedLongitude) || normalizedLongitude < -180 || normalizedLongitude > 180
    || !Number.isFinite(normalizedAccuracy) || normalizedAccuracy < 0 || normalizedAccuracy > 5_000
    || !normalizedLocation) return false;

  await listLoginHistory(userId);
  const result = await authPool.query(`
    UPDATE naviga_login_history
    SET location = $3,
      location_source = 'device',
      location_accuracy_meters = $4,
      latitude = $5,
      longitude = $6
    WHERE user_id = $1 AND session_id = $2
  `, [userId, sessionId, normalizedLocation, normalizedAccuracy, normalizedLatitude, normalizedLongitude]);
  return result.rowCount === 1;
}

export const auth = betterAuth({
  appName: 'NAVIGA',
  baseURL: process.env.BETTER_AUTH_URL?.trim() || 'http://localhost:3000',
  secret,
  database: authPool,
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  session: { expiresIn: 8 * 60 * 60, updateAge: 60 * 60 },
  databaseHooks: {
    session: {
      create: { after: recordLogin },
    },
  },
  user: {
    additionalFields: {
      unitId: { type: 'string', required: false, input: false },
      phone: { type: 'string', required: false, input: false },
    },
  },
  plugins: [admin({ defaultRole: 'unit', adminRoles: ['superadmin'] })],
});
