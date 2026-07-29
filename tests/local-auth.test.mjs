import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const require = createRequire(import.meta.url);
const localAuthPath = require.resolve('../src/lib/local-auth.js');
const unitRegistryPath = require.resolve('../src/lib/unit-registry.js');
const originalEnv = { ...process.env };

async function withLocalAuth(run) {
  const directory = await mkdtemp(join(tmpdir(), 'naviga-local-auth-test-'));
  process.env.NAVIGA_DATA_DIR = directory;
  process.env.NAVIGA_SUPERADMIN_EMAIL = 'superadmin@pegadaian.co.id';
  process.env.NAVIGA_SUPERADMIN_PASSWORD = 'SuperAdmin*0';
  process.env.NAVIGA_BOOTSTRAP_WANEA_PASSWORD = 'UpcWanea*0';
  process.env.NAVIGA_BOOTSTRAP_RANOTANA_PASSWORD = 'UpcRanotana*0';
  process.env.NAVIGA_SESSION_SECRET = 'secret-test-yang-cukup-panjang';
  delete require.cache[localAuthPath];
  delete require.cache[unitRegistryPath];

  try {
    await run(require('../src/lib/local-auth.js'));
  } finally {
    await rm(directory, { recursive: true, force: true });
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) delete process.env[key];
    }
    Object.assign(process.env, originalEnv);
    delete require.cache[localAuthPath];
    delete require.cache[unitRegistryPath];
  }
}

test('authenticates a persisted unit account with its server-side prefix scope', async () => {
  await withLocalAuth(async ({ authenticateLocalUser }) => {
    const user = await authenticateLocalUser(' UPC.WANEA@pegadaian.co.id ', 'UpcWanea*0');
    assert.ok(user, 'akun bootstrap Wanea harus dapat login');

    assert.deepEqual(user, {
      name: 'Admin Pegadaian Wanea',
      email: 'upc.wanea@pegadaian.co.id',
      role: 'unit',
      unitId: user.unitId,
      unitName: 'Pegadaian Wanea',
      unitPrefix: '11787',
      unitCode: '',
      unitDomicile: '',
      unitProvince: '',
      unitPhone: '',
      unitAddress: '',
      unitMapUrl: null,
      unitManagers: [],
      unitAppraisers: [],
      upc: 'Pegadaian Wanea',
    });
  });
});

test('authenticates Superadmin without attaching a unit prefix', async () => {
  await withLocalAuth(async ({ authenticateLocalUser, createSessionToken, verifySessionToken }) => {
    const now = 1_700_000_000_000;
    const user = await authenticateLocalUser('superadmin@pegadaian.co.id', 'SuperAdmin*0');
    assert.ok(user, 'akun bootstrap Superadmin harus dapat login');
    assert.deepEqual(
      { role: user.role, unitId: user.unitId, unitPrefix: user.unitPrefix, upc: user.upc },
      { role: 'superadmin', unitId: null, unitPrefix: null, upc: 'all' },
    );

    const token = createSessionToken(user, now);
    assert.deepEqual(verifySessionToken(token, now + 60_000), {
      ...user,
      expiresAt: now + 8 * 60 * 60 * 1000,
    });
    assert.equal(verifySessionToken(`${token}x`, now + 60_000), null);
  });
});

test('rejects an invalid local password', async () => {
  await withLocalAuth(async ({ authenticateLocalUser }) => {
    assert.equal(await authenticateLocalUser('upc.wanea@pegadaian.co.id', 'sandi-salah'), null);
  });
});
