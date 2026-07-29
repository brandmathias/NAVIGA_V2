import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

async function createTestRegistry() {
  const { createUnitRegistry } = await import('../src/lib/unit-registry.js');
  const directory = await mkdtemp(join(tmpdir(), 'naviga-unit-registry-test-'));
  const registry = createUnitRegistry({
    filePath: join(directory, 'unit-registry.json'),
    bootstrap: {
      superadmin: {
        name: 'Superadmin NAVIGA',
        email: 'superadmin@pegadaian.co.id',
        password: 'SuperAdmin*0',
      },
      units: [
        {
          name: 'Pegadaian Wanea',
          prefix: '11787',
          email: 'upc.wanea@pegadaian.co.id',
          password: 'UpcWanea*0',
        },
        {
          name: 'Pegadaian Ranotana',
          prefix: '11793',
          email: 'upc.ranotana@pegadaian.co.id',
          password: 'UpcRanotana*0',
        },
      ],
    },
  });
  return { directory, registry };
}

test('stores only hashes and authenticates Superadmin plus unit accounts', async () => {
  const { directory, registry } = await createTestRegistry();

  try {
    await registry.ensure();
    const superadmin = await registry.authenticate('superadmin@pegadaian.co.id', 'SuperAdmin*0');
    const wanea = await registry.authenticate('upc.wanea@pegadaian.co.id', 'UpcWanea*0');
    const stored = await readFile(join(directory, 'unit-registry.json'), 'utf8');

    assert.deepEqual(
      { role: superadmin.role, unitPrefix: superadmin.unitPrefix },
      { role: 'superadmin', unitPrefix: null },
    );
    assert.deepEqual(
      { role: wanea.role, unitName: wanea.unitName, unitPrefix: wanea.unitPrefix },
      { role: 'unit', unitName: 'Pegadaian Wanea', unitPrefix: '11787' },
    );
    assert.doesNotMatch(stored, /UpcWanea\*0|SuperAdmin\*0/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('creates a future unit once and rejects a duplicate prefix', async () => {
  const { directory, registry } = await createTestRegistry();

  try {
    await registry.ensure();
    const garuda = await registry.registerUnit({
      name: 'Pegadaian Garuda',
      prefix: '11799',
      email: 'upc.garuda@pegadaian.co.id',
      password: 'UpcGaruda*0',
    });

    assert.deepEqual(
      { name: garuda.name, prefix: garuda.prefix, email: garuda.email, active: garuda.active },
      { name: 'Pegadaian Garuda', prefix: '11799', email: 'upc.garuda@pegadaian.co.id', active: true },
    );
    await assert.rejects(
      registry.registerUnit({
        name: 'Pegadaian Duplikat',
        prefix: '11799',
        email: 'upc.duplikat@pegadaian.co.id',
        password: 'UpcDuplikat*0',
      }),
      /Prefix SBG sudah digunakan/,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('keeps unit profile fields and lets a Superadmin add another admin to that unit', async () => {
  const { directory, registry } = await createTestRegistry();

  try {
    await registry.ensure();
    const unit = await registry.registerUnit({
      name: 'Pegadaian Garuda',
      prefix: '11799',
      domicile: 'Manado',
      phone: '0431862000',
      address: 'Jl. Garuda No. 1, Manado',
      email: 'upc.garuda@pegadaian.co.id',
      password: 'UpcGaruda*0',
      adminName: 'Rani Garuda',
      adminPhone: '081234567890',
    });

    assert.deepEqual(
      {
        domicile: unit.domicile,
        phone: unit.phone,
        address: unit.address,
        adminName: unit.adminName,
        adminPhone: unit.adminPhone,
      },
      {
        domicile: 'Manado',
        phone: '0431862000',
        address: 'Jl. Garuda No. 1, Manado',
        adminName: 'Rani Garuda',
        adminPhone: '081234567890',
      },
    );

    const extraAdmin = await registry.registerUnitAdmin({
      unitId: unit.id,
      name: 'Bima Garuda',
      email: 'bima.garuda@pegadaian.co.id',
      password: 'BimaGaruda*0',
      domicile: 'Manado',
      phone: '081398765432',
      address: 'Jl. Garuda No. 1, Manado',
    });

    assert.deepEqual(
      { name: extraAdmin.name, unitId: extraAdmin.unitId, phone: extraAdmin.phone },
      { name: 'Bima Garuda', unitId: unit.id, phone: '081398765432' },
    );
    assert.equal((await registry.listUnitAdmins()).filter((admin) => admin.unitId === unit.id).length, 2);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
