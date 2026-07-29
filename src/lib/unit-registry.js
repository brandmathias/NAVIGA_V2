const { randomBytes, randomUUID, scryptSync, timingSafeEqual } = require('node:crypto');
const { mkdir, readFile, rename, writeFile } = require('node:fs/promises');
const { dirname, join } = require('node:path');
const { INDONESIAN_PROVINCES, formatUnitCode } = require('./unit-code');

const INDONESIAN_PROVINCE_SET = new Set(INDONESIAN_PROVINCES);

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

function validateProvince(value) {
  const province = normalizeText(value);
  if (!INDONESIAN_PROVINCE_SET.has(province)) throw new Error('Provinsi harus dipilih dari daftar provinsi Indonesia.');
  return province;
}

function normalizeText(value) {
  return String(value ?? '').trim();
}

function normalizePeople(value, label) {
  if (value == null) return [];
  if (!Array.isArray(value)) throw new Error(`${label} harus berupa daftar data.`);
  if (value.length > 20) throw new Error(`${label} maksimal 20 orang.`);
  return value.map((person) => {
    const name = normalizeText(person?.name);
    const nip = normalizeText(person?.nip);
    const phone = normalizeText(person?.phone);
    if (!name || !nip || !phone) throw new Error(`Data ${label} belum lengkap.`);
    return { name, nip, phone };
  });
}

function normalizeAdmins(value, fallback) {
  const source = Array.isArray(value) ? value : [fallback];
  if (!source.length || source.length > 20) throw new Error('Tambahkan minimal satu dan maksimal 20 akun admin unit.');
  const admins = source.map((admin) => {
    const name = normalizeText(admin?.name) || `Admin ${fallback.unitName}`;
    const email = normalizeEmail(admin?.email);
    const phone = normalizeText(admin?.phone);
    const password = validatePassword(admin?.password);
    if (!email) throw new Error('Email akun admin wajib diisi.');
    return { name, email, phone, password };
  });
  if (new Set(admins.map((admin) => admin.email)).size !== admins.length) throw new Error('Email akun admin tidak boleh ganda.');
  return admins;
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
    name: normalizeText(unit.name),
    prefix: validatePrefix(unit.prefix),
    domicile: normalizeText(unit.domicile),
    province: normalizeText(unit.province),
    phone: normalizeText(unit.phone),
    address: normalizeText(unit.address),
    adminName: normalizeText(unit.adminName),
    adminPhone: normalizeText(unit.adminPhone),
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
    domicile: unit.domicile ?? '',
    province: unit.province ?? '',
    unitCode: unit.unitCode ?? formatUnitCode(unit.domicile, unit.prefix),
    phone: unit.phone ?? '',
    address: unit.address ?? '',
    mapUrl: unit.mapUrl ?? '',
    managers: Array.isArray(unit.managers) ? unit.managers : [],
    appraisers: Array.isArray(unit.appraisers) ? unit.appraisers : [],
    email: account?.email ?? '',
    adminName: account?.name ?? '',
    adminPhone: account?.phone ?? '',
  };
}

function toPublicAdmin(registry, account) {
  const unit = registry.units.find((candidate) => candidate.id === account.unitId);
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    active: account.active,
    unitId: account.unitId,
    unitName: unit?.name ?? '',
    unitPrefix: unit?.prefix ?? '',
    unitCode: unit?.unitCode ?? formatUnitCode(unit?.domicile, unit?.prefix),
    domicile: account.domicile ?? unit?.domicile ?? '',
    phone: account.phone ?? '',
    address: account.address ?? unit?.address ?? '',
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
    unitCode: unit?.unitCode ?? (unit ? formatUnitCode(unit.domicile, unit.prefix) : null),
    unitDomicile: unit?.domicile ?? null,
    unitProvince: unit?.province ?? null,
    unitPhone: unit?.phone ?? null,
    unitAddress: unit?.address ?? null,
    unitMapUrl: unit?.mapUrl ?? null,
    unitManagers: Array.isArray(unit?.managers) ? unit.managers : [],
    unitAppraisers: Array.isArray(unit?.appraisers) ? unit.appraisers : [],
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
            domicile: unit.domicile,
            province: unit.province,
            unitCode: formatUnitCode(unit.domicile, unit.prefix),
            phone: unit.phone,
            address: unit.address,
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
                name: unit.adminName || `Admin ${unit.name}`,
                email: unit.email,
                passwordHash: hashPassword(unit.password),
                role: 'unit',
                unitId: units[index].id,
                domicile: unit.domicile,
                phone: unit.adminPhone,
                address: unit.address,
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

  async function listUnitAdmins() {
    await ensure();
    const registry = await readRegistry();
    return registry.accounts
      .filter((account) => account.role === 'unit')
      .map((account) => toPublicAdmin(registry, account))
      .sort((left, right) => left.name.localeCompare(right.name));
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
      const name = normalizeText(input?.name);
      const prefix = validatePrefix(input?.prefix);
      const domicile = normalizeText(input?.domicile);
      const province = validateProvince(input?.province);
      const phone = normalizeText(input?.phone);
      const address = normalizeText(input?.address);
      const mapUrl = normalizeText(input?.mapUrl);
      const managers = normalizePeople(input?.managers, 'pengelola unit');
      const appraisers = normalizePeople(input?.appraisers, 'penaksir unit');
      const admins = normalizeAdmins(input?.admins, {
        unitName: name,
        name: input?.adminName,
        email: input?.email,
        phone: input?.adminPhone,
        password: input?.password,
      });
      if (!name || !domicile) throw new Error('Nama unit, kota/kabupaten, dan domisili wajib diisi.');
      if (registry.units.some((unit) => unit.prefix === prefix)) throw new Error('Prefix SBG sudah digunakan.');
      if (admins.some((admin) => registry.accounts.some((account) => account.email === admin.email))) throw new Error('Email akun sudah digunakan.');

      const now = new Date().toISOString();
      const unit = { id: randomUUID(), name, prefix, domicile, province, unitCode: formatUnitCode(domicile, prefix), phone, address, mapUrl, managers, appraisers, active: true, createdAt: now };
      registry.units.push(unit);
      registry.accounts.push(...admins.map((admin) => ({
        id: randomUUID(), name: admin.name, email: admin.email, passwordHash: hashPassword(admin.password), role: 'unit', unitId: unit.id,
        domicile, phone: admin.phone, address, active: true, createdAt: now,
      })));
      await writeRegistry(registry);
      return toPublicUnit(registry, unit);
    });
    mutationQueue = task.catch(() => undefined);
    return task;
  }

  function registerUnitAdmin(input) {
    const task = mutationQueue.then(async () => {
      await ensure();
      const registry = await readRegistry();
      const unitId = normalizeText(input?.unitId);
      const unit = registry.units.find((candidate) => candidate.id === unitId && candidate.active);
      const name = normalizeText(input?.name);
      const email = normalizeEmail(input?.email);
      const password = validatePassword(input?.password);
      const domicile = normalizeText(input?.domicile) || unit?.domicile || '';
      const phone = normalizeText(input?.phone);
      const address = normalizeText(input?.address) || unit?.address || '';

      if (!unit) throw new Error('Unit aktif tidak ditemukan.');
      if (!name || !email) throw new Error('Nama dan email akun admin wajib diisi.');
      if (registry.accounts.some((account) => account.email === email)) throw new Error('Email akun sudah digunakan.');

      const account = {
        id: randomUUID(),
        name,
        email,
        passwordHash: hashPassword(password),
        role: 'unit',
        unitId: unit.id,
        domicile,
        phone,
        address,
        active: true,
        createdAt: new Date().toISOString(),
      };
      registry.accounts.push(account);
      await writeRegistry(registry);
      return toPublicAdmin(registry, account);
    });
    mutationQueue = task.catch(() => undefined);
    return task;
  }

  function updateUnit(input) {
    const task = mutationQueue.then(async () => {
      await ensure();
      const registry = await readRegistry();
      const id = normalizeText(input?.id);
      const unit = registry.units.find((candidate) => candidate.id === id && candidate.active);
      const name = normalizeText(input?.name);
      const prefix = validatePrefix(input?.prefix);
      const domicile = normalizeText(input?.domicile);
      const province = validateProvince(input?.province);
      const phone = normalizeText(input?.phone);
      const address = normalizeText(input?.address);
      const mapUrl = normalizeText(input?.mapUrl);
      const managers = normalizePeople(input?.managers, 'pengelola unit');
      const appraisers = normalizePeople(input?.appraisers, 'penaksir unit');
      const admins = Array.isArray(input?.admins) && input.admins.length ? normalizeAdmins(input.admins, { unitName: name }) : [];

      if (!unit) throw new Error('Unit aktif tidak ditemukan.');
      if (!name || !domicile) throw new Error('Nama unit dan domisili wajib diisi.');
      if (registry.units.some((candidate) => candidate.id !== unit.id && candidate.prefix === prefix)) throw new Error('Prefix SBG sudah digunakan.');
      if (admins.some((admin) => registry.accounts.some((account) => account.email === admin.email))) throw new Error('Email akun sudah digunakan.');

      const updatedAt = new Date().toISOString();
      Object.assign(unit, { name, prefix, domicile, province, unitCode: formatUnitCode(domicile, prefix), phone, address, mapUrl, managers, appraisers, updatedAt });
      registry.accounts.filter((account) => account.role === 'unit' && account.unitId === unit.id).forEach((account) => Object.assign(account, { domicile, address, updatedAt }));
      registry.accounts.push(...admins.map((admin) => ({ id: randomUUID(), name: admin.name, email: admin.email, passwordHash: hashPassword(admin.password), role: 'unit', unitId: unit.id, domicile, phone: admin.phone, address, active: true, createdAt: updatedAt })));
      await writeRegistry(registry);
      return toPublicUnit(registry, unit);
    });
    mutationQueue = task.catch(() => undefined);
    return task;
  }

  function updateUnitAdmin(input) {
    const task = mutationQueue.then(async () => {
      await ensure();
      const registry = await readRegistry();
      const id = normalizeText(input?.id);
      const account = registry.accounts.find((candidate) => candidate.id === id && candidate.role === 'unit' && candidate.active);
      const unitId = normalizeText(input?.unitId);
      const unit = registry.units.find((candidate) => candidate.id === unitId && candidate.active);
      const name = normalizeText(input?.name);
      const email = normalizeEmail(input?.email);
      const phone = normalizeText(input?.phone);
      const password = String(input?.password ?? '');

      if (!account) throw new Error('Akun admin aktif tidak ditemukan.');
      if (!unit) throw new Error('Unit aktif tidak ditemukan.');
      if (!name || !email) throw new Error('Nama dan email akun admin wajib diisi.');
      if (registry.accounts.some((candidate) => candidate.id !== account.id && candidate.email === email)) throw new Error('Email akun sudah digunakan.');
      if (password && password.length < 8) throw new Error('Password minimal 8 karakter.');

      Object.assign(account, { name, email, unitId: unit.id, domicile: unit.domicile, phone, address: unit.address, ...(password ? { passwordHash: hashPassword(password) } : {}), updatedAt: new Date().toISOString() });
      await writeRegistry(registry);
      return toPublicAdmin(registry, account);
    });
    mutationQueue = task.catch(() => undefined);
    return task;
  }

  return { ensure, authenticate, getActiveUnitByPrefix, listUnits, listUnitAdmins, registerUnit, registerUnitAdmin, updateUnit, updateUnitAdmin };
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
  listUnitAdmins: defaultRegistry.listUnitAdmins,
  registerUnit: defaultRegistry.registerUnit,
  registerUnitAdmin: defaultRegistry.registerUnitAdmin,
  updateUnit: defaultRegistry.updateUnit,
  updateUnitAdmin: defaultRegistry.updateUnitAdmin,
};
