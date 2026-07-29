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
      domicile: 'Manado',
      province: 'Sulawesi Utara',
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
        domicile: 'Manado',
        province: 'Sulawesi Utara',
        email: 'upc.duplikat@pegadaian.co.id',
        password: 'UpcDuplikat*0',
      }),
      /Prefix SBG sudah digunakan/,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('rejects a unit domicile outside the official Indonesian province list', async () => {
  const { directory, registry } = await createTestRegistry();

  try {
    await registry.ensure();
    await assert.rejects(
      registry.registerUnit({
        name: 'Pegadaian Tidak Valid',
        prefix: '11801',
        domicile: 'Manado',
        province: 'Sulawesi Utara Timur',
        email: 'upc.invalid@pegadaian.co.id',
        password: 'UnitValid*0',
      }),
      /Provinsi harus dipilih dari daftar provinsi Indonesia/,
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
      province: 'Sulawesi Utara',
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
        unitCode: unit.unitCode,
        province: unit.province,
        phone: unit.phone,
        address: unit.address,
        adminName: unit.adminName,
        adminPhone: unit.adminPhone,
      },
      {
        domicile: 'Manado',
        unitCode: 'CP-MND-11799',
        province: 'Sulawesi Utara',
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

test('persists unit staff, map link, and every queued unit-admin account together', async () => {
  const { directory, registry } = await createTestRegistry();

  try {
    await registry.ensure();
    const unit = await registry.registerUnit({
      name: 'Pegadaian Garuda',
      prefix: '11799',
      domicile: 'Manado',
      province: 'Sulawesi Utara',
      phone: '0431862000',
      address: 'Jl. Garuda No. 1, Manado',
      mapUrl: 'https://maps.google.com/?q=Pegadaian+Garuda',
      managers: [{ name: 'Santi Garuda', nip: '19850110 201001 1 001', phone: '081234567890' }],
      appraisers: [{ name: 'Bima Garuda', nip: '19860211 201101 1 002', phone: '081298765432' }],
      admins: [
        { name: 'Admin Garuda', email: 'admin.garuda@pegadaian.co.id', phone: '081211111111', password: 'GarudaAdmin*0' },
        { name: 'Admin Dua', email: 'admin.dua@pegadaian.co.id', phone: '081222222222', password: 'GarudaAdmin*1' },
      ],
    });

    assert.deepEqual(
      { mapUrl: unit.mapUrl, managers: unit.managers, appraisers: unit.appraisers },
      {
        mapUrl: 'https://maps.google.com/?q=Pegadaian+Garuda',
        managers: [{ name: 'Santi Garuda', nip: '19850110 201001 1 001', phone: '081234567890' }],
        appraisers: [{ name: 'Bima Garuda', nip: '19860211 201101 1 002', phone: '081298765432' }],
      },
    );
    assert.equal((await registry.listUnitAdmins()).filter((admin) => admin.unitId === unit.id).length, 2);
    const authenticated = await registry.authenticate('admin.dua@pegadaian.co.id', 'GarudaAdmin*1');
    assert.deepEqual(
      {
        unitCode: authenticated.unitCode,
        unitMapUrl: authenticated.unitMapUrl,
        unitManagers: authenticated.unitManagers,
        unitAppraisers: authenticated.unitAppraisers,
      },
      {
        unitCode: 'CP-MND-11799',
        unitMapUrl: 'https://maps.google.com/?q=Pegadaian+Garuda',
        unitManagers: [{ name: 'Santi Garuda', nip: '19850110 201001 1 001', phone: '081234567890' }],
        unitAppraisers: [{ name: 'Bima Garuda', nip: '19860211 201101 1 002', phone: '081298765432' }],
      },
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('updates a unit and an existing admin account without replacing its password', async () => {
  const { directory, registry } = await createTestRegistry();

  try {
    await registry.ensure();
    const unit = await registry.registerUnit({
      name: 'Pegadaian Garuda',
      prefix: '11799',
      domicile: 'Sulawesi Utara',
      province: 'Sulawesi Utara',
      phone: '0431862000',
      address: 'Jl. Garuda No. 1, Manado',
      mapUrl: 'https://maps.google.com/?q=Pegadaian+Garuda',
      managers: [{ name: 'Santi Garuda', nip: '19850110 201001 1 001', phone: '081234567890' }],
      appraisers: [],
      admins: [{ name: 'Admin Garuda', email: 'admin.garuda@pegadaian.co.id', phone: '081211111111', password: 'GarudaAdmin*0' }],
    });
    const admin = (await registry.listUnitAdmins()).find((candidate) => candidate.email === 'admin.garuda@pegadaian.co.id');

    const updatedUnit = await registry.updateUnit({
      id: unit.id,
      name: 'Pegadaian Garuda Bali',
      prefix: '11801',
      domicile: 'Bali',
      province: 'Bali',
      phone: '0361123456',
      address: 'Jl. Garuda No. 10, Denpasar',
      mapUrl: 'https://maps.google.com/?q=Pegadaian+Garuda+Bali',
      managers: [{ name: 'Santi Bali', nip: '19850110 201001 1 001', phone: '081234567890' }],
      appraisers: [],
      admins: [],
    });
    const updatedAdmin = await registry.updateUnitAdmin({
      id: admin.id,
      unitId: unit.id,
      name: 'Admin Garuda Bali',
      email: 'admin.garuda.bali@pegadaian.co.id',
      phone: '081299999999',
      password: '',
    });

    assert.deepEqual(
      { name: updatedUnit.name, unitCode: updatedUnit.unitCode, province: updatedUnit.province, address: updatedUnit.address },
      { name: 'Pegadaian Garuda Bali', unitCode: 'CP-DPS-11801', province: 'Bali', address: 'Jl. Garuda No. 10, Denpasar' },
    );
    assert.deepEqual(
      { name: updatedAdmin.name, email: updatedAdmin.email, domicile: updatedAdmin.domicile, phone: updatedAdmin.phone },
      { name: 'Admin Garuda Bali', email: 'admin.garuda.bali@pegadaian.co.id', domicile: 'Bali', phone: '081299999999' },
    );
    assert.equal((await registry.authenticate('admin.garuda.bali@pegadaian.co.id', 'GarudaAdmin*0')).unitCode, 'CP-DPS-11801');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
