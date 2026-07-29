const { randomBytes, randomUUID, scryptSync, timingSafeEqual } = require('node:crypto');
const { mkdir, readFile, rename, writeFile } = require('node:fs/promises');
const { dirname, join } = require('node:path');

function normalizeEmail(value) {
  return String(value ?? '').trim().toLowerCase();
}

function validatePrefix(value) {
  const prefix = String(value ?? '').trim();
  if (!/^\d{5}$/.test(prefix)) throw new Error('Prefix SBG harus terdiri dari tepat 5 angka.');
  return prefix;
}

function validatePassword(value) {
  const password = String(value ?? '');
  if (password.length < 8) throw new Error('Password minimal 8 karakter.');
  return password;
}

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}

function verifyPassword(password, storedHash) {
  const [salt, key] = String(storedHash ?? '').split(':');
  if (!salt || !key) return false;
  const expected = Buffer.from(key, 'hex');
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function validateBootstrap(bootstrap) {
  if (!bootstrap?.superadmin || !Array.isArray(bootstrap.units)) {
    throw new Error('Konfigurasi akun awal NAVIGA belum lengkap.');
  }

  const superadmin = {
    name: String(bootstrap.superadmin.name ?? '').trim() || 'Superadmin NAVIGA',
    email: normalizeEmail(bootstrap.superadmin.email),
    password: validatePassword(bootstrap.superadmin.password),
  };
  if (!superadmin.email) throw new Error('Email Superadmin wajib diatur.');

  const units = bootstrap.units.map((unit) => ({
    name: String(unit.name ?? '').trim(),
    prefix: validatePrefix(unit.prefix),
    email: normalizeEmail(unit.email),
    password: validatePassword(unit.password),
  }));
  if (units.some((unit) => !unit.name || !unit.email)) {
    throw new Error('Nama dan email akun unit wajib diatur.');
  }
  if (new Set(units.map((unit) => unit.prefix)).size !== units.length) {
    throw new Error('Prefix SBG akun awal tidak boleh ganda.');
  }
  if (new Set([superadmin.email, ...units.map((unit) => unit.email)]).size !== units.length + 1) {
    throw new Error('Email akun awal tidak boleh ganda.');
  }

  return { superadmin, units };
}

function toPublicUnit(registry, unit) {
  const account = registry.accounts.find((candidate) => candidate.unitId === unit.id && candidate.role === 'unit');
  return {
    id: unit.id,
    name: unit.name,
    prefix: unit.prefix,
    active: unit.active,
    email: account?.email ?? '',
  };
}

function toAuthenticatedUser(registry, account) {
  const unit = account.unitId ? registry.units.find((candidate) => candidate.id === account.unitId) : null;
  if (account.role === 'unit' && (!unit || !unit.active)) return null;

  return {
    name: account.name,
    email: account.email,
    role: account.role,
    unitId: unit?.id ?? null,
    unitName: unit?.name ?? null,
    unitPrefix: unit?.prefix ?? null,
    upc: unit?.name ?? 'all',
  };
}

function createUnitRegistry({ filePath, bootstrap }) {
  let ensurePromise;
  let mutationQueue = Promise.resolve();

  async function writeRegistry(registry) {
    await mkdir(dirname(filePath), { recursive: true });
    const tempPath = `${filePath}.${randomUUID()}.tmp`;
    await writeFile(tempPath, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
    await rename(tempPath, filePath);
  }

  async function readRegistry() {
    const raw = await readFile(filePath, 'utf8');
    try {
      const registry = JSON.parse(raw);
      if (!Array.isArray(registry?.units) || !Array.isArray(registry?.accounts)) throw new Error('shape');
      return registry;
    } catch {
      throw new Error('Registry akun lokal tidak valid. Pulihkan file .naviga/unit-registry.json.');
    }
  }

  async function ensure() {
    if (!ensurePromise) {
      ensurePromise = (async () => {
        try {
          await readRegistry();
        } catch (error) {
          if (error?.code !== 'ENOENT') throw error;
          const initial = validateBootstrap(typeof bootstrap === 'function' ? bootstrap() : bootstrap);
          const now = new Date().toISOString();
          const units = initial.units.map((unit) => ({
            id: randomUUID(),
            name: unit.name,
            prefix: unit.prefix,
            active: true,
            createdAt: now,
          }));
          await writeRegistry({
            version: 1,
            units,
            accounts: [
              {
                id: randomUUID(),
                name: initial.superadmin.name,
                email: initial.superadmin.email,
                passwordHash: hashPassword(initial.superadmin.password),
                role: 'superadmin',
                unitId: null,
                active: true,
                createdAt: now,
              },
              ...initial.units.map((unit, index) => ({
                id: randomUUID(),
                name: `Admin ${unit.name}`,
                email: unit.email,
                passwordHash: hashPassword(unit.password),
                role: 'unit',
                unitId: units[index].id,
                active: true,
                createdAt: now,
              })),
            ],
          });
        }
      })();
    }
    await ensurePromise;
  }

  async function authenticate(email, password) {
    await ensure();
    const registry = await readRegistry();
    const account = registry.accounts.find((candidate) =>
      candidate.active && candidate.email === normalizeEmail(email) && verifyPassword(String(password ?? ''), candidate.passwordHash)
    );
    return account ? toAuthenticatedUser(registry, account) : null;
  }

  async function listUnits() {
    await ensure();
    const registry = await readRegistry();
    return registry.units.map((unit) => toPublicUnit(registry, unit)).sort((left, right) => left.name.localeCompare(right.name));
  }

  async function getActiveUnitByPrefix(prefix) {
    await ensure();
    const registry = await readRegistry();
    const unit = registry.units.find((candidate) => candidate.active && candidate.prefix === validatePrefix(prefix));
    return unit ? toPublicUnit(registry, unit) : null;
  }

  function registerUnit(input) {
    const task = mutationQueue.then(async () => {
      await ensure();
      const registry = await readRegistry();
      const name = String(input?.name ?? '').trim();
      const prefix = validatePrefix(input?.prefix);
      const email = normalizeEmail(input?.email);
      const password = validatePassword(input?.password);
      if (!name || !email) throw new Error('Nama unit dan email wajib diisi.');
      if (registry.units.some((unit) => unit.prefix === prefix)) throw new Error('Prefix SBG sudah digunakan.');
      if (registry.accounts.some((account) => account.email === email)) throw new Error('Email akun sudah digunakan.');

      const now = new Date().toISOString();
      const unit = { id: randomUUID(), name, prefix, active: true, createdAt: now };
      registry.units.push(unit);
      registry.accounts.push({
        id: randomUUID(),
        name: `Admin ${name}`,
        email,
        passwordHash: hashPassword(password),
        role: 'unit',
        unitId: unit.id,
        active: true,
        createdAt: now,
      });
      await writeRegistry(registry);
      return toPublicUnit(registry, unit);
    });
    mutationQueue = task.catch(() => undefined);
    return task;
  }

  return { ensure, authenticate, getActiveUnitByPrefix, listUnits, registerUnit };
}

function bootstrapFromEnvironment() {
  return {
    superadmin: {
      name: process.env.NAVIGA_SUPERADMIN_NAME ?? 'Superadmin NAVIGA',
      email: process.env.NAVIGA_SUPERADMIN_EMAIL ?? 'superadmin@pegadaian.co.id',
      password: process.env.NAVIGA_SUPERADMIN_PASSWORD,
    },
    units: [
      {
        name: 'Pegadaian Wanea',
        prefix: '11787',
        email: 'upc.wanea@pegadaian.co.id',
        password: process.env.NAVIGA_BOOTSTRAP_WANEA_PASSWORD,
      },
      {
        name: 'Pegadaian Ranotana',
        prefix: '11793',
        email: 'upc.ranotana@pegadaian.co.id',
        password: process.env.NAVIGA_BOOTSTRAP_RANOTANA_PASSWORD,
      },
    ],
  };
}

const defaultRegistry = createUnitRegistry({
  filePath: join(process.env.NAVIGA_DATA_DIR ?? join(process.cwd(), '.naviga'), 'unit-registry.json'),
  bootstrap: bootstrapFromEnvironment,
});

module.exports = {
  createUnitRegistry,
  authenticateAccount: defaultRegistry.authenticate,
  getActiveUnitByPrefix: defaultRegistry.getActiveUnitByPrefix,
  listUnits: defaultRegistry.listUnits,
  registerUnit: defaultRegistry.registerUnit,
};
