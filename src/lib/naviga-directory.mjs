import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { auth, authPool } from './auth.mjs';
import unitCode from './unit-code.js';

const { INDONESIAN_PROVINCES, formatUnitCode } = unitCode;
const provinceSet = new Set(INDONESIAN_PROVINCES);
const schemaReady = new WeakMap();
const directoryFile = () => join(process.env.NAVIGA_DATA_DIR ?? join(process.cwd(), '.naviga'), 'unit-registry.json');

const CREATE_DIRECTORY_TABLE = `
  CREATE TABLE IF NOT EXISTS naviga_units (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    prefix TEXT NOT NULL UNIQUE,
    domicile TEXT NOT NULL,
    province TEXT NOT NULL,
    unit_code TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    map_url TEXT NOT NULL DEFAULT '',
    managers JSONB NOT NULL DEFAULT '[]'::jsonb,
    appraisers JSONB NOT NULL DEFAULT '[]'::jsonb,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS naviga_units_active_idx ON naviga_units (active, name);
`;

const text = (value) => String(value ?? '').trim();
const email = (value) => text(value).toLowerCase();
const asJson = (value) => (typeof value === 'string' ? JSON.parse(value) : value);

function validatePrefix(value) {
  const prefix = text(value);
  if (!/^\d{5}$/.test(prefix)) throw new Error('Prefix SBG harus terdiri dari tepat 5 angka.');
  return prefix;
}

function validatePassword(value) {
  const password = String(value ?? '');
  if (password.length < 8) throw new Error('Password minimal 8 karakter.');
  return password;
}

function validateProvince(value) {
  const province = text(value);
  if (!provinceSet.has(province)) throw new Error('Provinsi harus dipilih dari daftar provinsi Indonesia.');
  return province;
}

function people(value, label) {
  if (value == null) return [];
  if (!Array.isArray(value) || value.length > 20) throw new Error(`${label} maksimal 20 orang.`);
  return value.map((person) => {
    const normalized = { name: text(person?.name), nip: text(person?.nip), phone: text(person?.phone) };
    if (!normalized.name || !normalized.nip || !normalized.phone) throw new Error(`Data ${label} belum lengkap.`);
    return normalized;
  });
}

function admins(value, fallback) {
  const input = Array.isArray(value) && value.length ? value : [fallback];
  if (input.length > 20) throw new Error('Maksimal 20 akun admin unit.');
  return input.map((item) => ({
    name: text(item?.name) || `Admin ${fallback.unitName}`,
    email: email(item?.email),
    phone: text(item?.phone),
    password: validatePassword(item?.password),
  }));
}

async function ensureSchema() {
  const cached = schemaReady.get(authPool);
  if (cached) return cached;
  const promise = authPool.query(CREATE_DIRECTORY_TABLE).then(() => undefined).catch((error) => {
    schemaReady.delete(authPool);
    throw error;
  });
  schemaReady.set(authPool, promise);
  return promise;
}

function publicUnit(row, account = null) {
  return {
    id: row.id, name: row.name, prefix: row.prefix, active: row.active,
    domicile: row.domicile, province: row.province, unitCode: row.unit_code,
    phone: row.phone, address: row.address, mapUrl: row.map_url,
    managers: asJson(row.managers) ?? [], appraisers: asJson(row.appraisers) ?? [],
    email: account?.email ?? '', adminName: account?.name ?? '', adminPhone: account?.phone ?? '',
  };
}

async function userByEmail(value) {
  const result = await authPool.query('SELECT id, name, email, role, "unitId", phone, banned FROM "user" WHERE email = $1', [email(value)]);
  return result.rows[0] ?? null;
}

export async function getUnitById(id) {
  await ensureSchema();
  const result = await authPool.query('SELECT * FROM naviga_units WHERE id = $1', [text(id)]);
  return result.rowCount ? publicUnit(result.rows[0]) : null;
}

export async function listUnits() {
  await ensureSchema();
  const [units, users] = await Promise.all([
    authPool.query('SELECT * FROM naviga_units ORDER BY name'),
    authPool.query('SELECT name, email, "unitId", phone FROM "user" WHERE role = $1 AND banned IS NOT TRUE', ['unit']),
  ]);
  const primary = new Map();
  for (const account of users.rows) if (!primary.has(account.unitId)) primary.set(account.unitId, account);
  return units.rows.map((unit) => publicUnit(unit, primary.get(unit.id)));
}

export async function listUnitAdmins() {
  await ensureSchema();
  const result = await authPool.query(`
    SELECT u.id, u.name, u.email, u.phone, u."unitId", u.banned, n.name AS unit_name, n.prefix, n.unit_code, n.domicile, n.address
    FROM "user" u JOIN naviga_units n ON n.id = u."unitId"
    WHERE u.role = 'unit' AND u.banned IS NOT TRUE ORDER BY u.name
  `);
  return result.rows.map((row) => ({
    id: row.id, name: row.name, email: row.email, active: !row.banned,
    unitId: row.unitId, unitName: row.unit_name, unitPrefix: row.prefix,
    unitCode: row.unit_code, domicile: row.domicile, phone: row.phone ?? '', address: row.address ?? '',
  }));
}

async function createAccount({ name, email: accountEmail, phone, password, unitId }, headers) {
  const existing = await userByEmail(accountEmail);
  if (existing) throw new Error('Email akun sudah digunakan.');
  const result = await auth.api.createUser({
    body: { name, email: accountEmail, password, role: 'unit', data: { unitId, phone } },
    ...(headers ? { headers } : {}),
  });
  return result.user;
}

export async function registerUnit(input, headers) {
  await ensureSchema();
  const name = text(input?.name), prefix = validatePrefix(input?.prefix), domicile = text(input?.domicile);
  if (!name || !domicile) throw new Error('Nama unit dan domisili wajib diisi.');
  const province = validateProvince(input?.province), phone = text(input?.phone), address = text(input?.address), mapUrl = text(input?.mapUrl);
  const managers = people(input?.managers, 'pengelola unit'), appraisers = people(input?.appraisers, 'penaksir unit');
  const accountList = admins(input?.admins, { unitName: name, name: input?.adminName, email: input?.email, phone: input?.adminPhone, password: input?.password });
  if (new Set(accountList.map((item) => item.email)).size !== accountList.length || accountList.some((item) => !item.email)) throw new Error('Email akun admin tidak valid atau ganda.');
  const id = randomUUID();
  try {
    await authPool.query(`INSERT INTO naviga_units (id,name,prefix,domicile,province,unit_code,phone,address,map_url,managers,appraisers)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::jsonb)`, [id,name,prefix,domicile,province,formatUnitCode(domicile,prefix),phone,address,mapUrl,JSON.stringify(managers),JSON.stringify(appraisers)]);
  } catch (error) {
    if (error?.code === '23505') throw new Error('Prefix SBG sudah digunakan.');
    throw error;
  }
  try {
    for (const account of accountList) await createAccount({ ...account, unitId: id }, headers);
  } catch (error) {
    await authPool.query('DELETE FROM naviga_units WHERE id = $1', [id]);
    throw error;
  }
  return getUnitById(id);
}

export async function registerUnitAdmin(input, headers) {
  await ensureSchema();
  const unitId = text(input?.unitId), unit = await getUnitById(unitId);
  if (!unit?.active) throw new Error('Unit aktif tidak ditemukan.');
  const account = { name: text(input?.name), email: email(input?.email), phone: text(input?.phone), password: validatePassword(input?.password), unitId };
  if (!account.name || !account.email) throw new Error('Nama dan email akun admin wajib diisi.');
  const created = await createAccount(account, headers);
  return { id: created.id, name: created.name, email: created.email, active: true, unitId, unitName: unit.name, unitPrefix: unit.prefix, unitCode: unit.unitCode, domicile: unit.domicile, phone: account.phone, address: unit.address };
}

export async function updateUnit(input, headers) {
  await ensureSchema();
  const id = text(input?.id), current = await getUnitById(id);
  if (!current?.active) throw new Error('Unit aktif tidak ditemukan.');
  const name = text(input?.name), prefix = validatePrefix(input?.prefix), domicile = text(input?.domicile);
  if (!name || !domicile) throw new Error('Nama unit dan domisili wajib diisi.');
  const province = validateProvince(input?.province), phone = text(input?.phone), address = text(input?.address), mapUrl = text(input?.mapUrl);
  const managers = people(input?.managers, 'pengelola unit'), appraisers = people(input?.appraisers, 'penaksir unit');
  try {
    await authPool.query(`UPDATE naviga_units SET name=$2,prefix=$3,domicile=$4,province=$5,unit_code=$6,phone=$7,address=$8,map_url=$9,managers=$10::jsonb,appraisers=$11::jsonb,updated_at=NOW() WHERE id=$1`, [id,name,prefix,domicile,province,formatUnitCode(domicile,prefix),phone,address,mapUrl,JSON.stringify(managers),JSON.stringify(appraisers)]);
  } catch (error) {
    if (error?.code === '23505') throw new Error('Prefix SBG sudah digunakan.');
    throw error;
  }
  const additionalAdmins = Array.isArray(input?.admins) && input.admins.length ? admins(input.admins, { unitName: name }) : [];
  for (const account of additionalAdmins) await createAccount({ ...account, unitId: id }, headers);
  return getUnitById(id);
}

export async function updateUnitAdmin(input, headers) {
  await ensureSchema();
  const id = text(input?.id), unitId = text(input?.unitId), unit = await getUnitById(unitId);
  if (!unit?.active) throw new Error('Unit aktif tidak ditemukan.');
  const name = text(input?.name), accountEmail = email(input?.email), phone = text(input?.phone), password = String(input?.password ?? '');
  if (!name || !accountEmail) throw new Error('Nama dan email akun admin wajib diisi.');
  const existing = await authPool.query('SELECT id FROM "user" WHERE id = $1 AND role = $2', [id, 'unit']);
  if (!existing.rowCount) throw new Error('Akun admin aktif tidak ditemukan.');
  const collision = await authPool.query('SELECT id FROM "user" WHERE email = $1 AND id <> $2', [accountEmail, id]);
  if (collision.rowCount) throw new Error('Email akun sudah digunakan.');
  await auth.api.adminUpdateUser({ body: { userId: id, data: { name, email: accountEmail, unitId, phone } }, headers });
  if (password) await auth.api.setUserPassword({ body: { userId: id, newPassword: validatePassword(password) }, headers });
  return { id, name, email: accountEmail, active: true, unitId, unitName: unit.name, unitPrefix: unit.prefix, unitCode: unit.unitCode, domicile: unit.domicile, phone, address: unit.address };
}

export async function deleteUnitAdmin(id) {
  await ensureSchema();
  const accountId = text(id);
  if (!accountId) throw new Error('Akun admin unit tidak valid.');

  const existing = await authPool.query(
    `SELECT u.id, u.name, u.email, u.phone, u."unitId", n.name AS unit_name, n.prefix, n.unit_code, n.domicile, n.address
     FROM "user" u
     JOIN naviga_units n ON n.id = u."unitId"
     WHERE u.id = $1 AND u.role = 'unit' AND u.banned IS NOT TRUE`,
    [accountId],
  );
  if (!existing.rowCount) throw new Error('Akun admin unit aktif tidak ditemukan.');

  await authPool.query('UPDATE "user" SET banned = true WHERE id = $1', [accountId]);

  const row = existing.rows[0];
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    active: false,
    unitId: row.unitId,
    unitName: row.unit_name,
    unitPrefix: row.prefix,
    unitCode: row.unit_code,
    domicile: row.domicile,
    phone: row.phone ?? '',
    address: row.address ?? '',
  };
}

function bootstrapPassword(account) {
  const accountEmail = email(account.email);
  if (accountEmail === email(process.env.NAVIGA_SUPERADMIN_EMAIL ?? 'superadmin@pegadaian.co.id')) return process.env.NAVIGA_SUPERADMIN_PASSWORD;
  if (accountEmail === 'upc.wanea@pegadaian.co.id') return process.env.NAVIGA_BOOTSTRAP_WANEA_PASSWORD;
  if (accountEmail === 'upc.ranotana@pegadaian.co.id') return process.env.NAVIGA_BOOTSTRAP_RANOTANA_PASSWORD;
  return null;
}

export async function bootstrapDirectory() {
  await ensureSchema();
  const existingUsers = await authPool.query('SELECT COUNT(*)::int AS count FROM "user"');
  if (existingUsers.rows[0].count > 0) return { created: false, units: 0, users: 0 };
  let legacy;
  try { legacy = JSON.parse(await readFile(directoryFile(), 'utf8')); } catch (error) { if (error?.code !== 'ENOENT') throw error; }
  if (!legacy?.units || !legacy?.accounts) throw new Error('Data registry lama tidak ditemukan. Pulihkan .naviga/unit-registry.json sebelum menjalankan bootstrap.');
  const unresolved = legacy.accounts.filter((account) => !bootstrapPassword(account));
  if (unresolved.length) throw new Error(`${unresolved.length} akun lama tidak memiliki sandi awal yang dapat dimigrasikan. Atur ulang sandi akun tersebut terlebih dahulu.`);
  for (const unit of legacy.units) {
    await authPool.query(`INSERT INTO naviga_units (id,name,prefix,domicile,province,unit_code,phone,address,map_url,managers,appraisers,active)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::jsonb,$12)`, [unit.id,unit.name,unit.prefix,unit.domicile ?? '',unit.province ?? '',unit.unitCode ?? formatUnitCode(unit.domicile,unit.prefix),unit.phone ?? '',unit.address ?? '',unit.mapUrl ?? '',JSON.stringify(unit.managers ?? []),JSON.stringify(unit.appraisers ?? []),unit.active !== false]);
  }
  for (const account of legacy.accounts) {
    const password = validatePassword(bootstrapPassword(account));
    await auth.api.createUser({ body: { name: account.name, email: email(account.email), password, role: account.role, data: { unitId: account.unitId ?? null, phone: account.phone ?? '' } } });
  }
  return { created: true, units: legacy.units.length, users: legacy.accounts.length };
}
