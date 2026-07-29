import assert from 'node:assert/strict';
import test from 'node:test';
import broadcastQueue from '../src/lib/broadcast-queue.js';

const {
  getAllowedPrefixes,
  queueGadaiCustomers,
  queueInstallmentCustomers,
} = broadcastQueue;

const activeUnits = [
  { id: 'wanea', name: 'Pegadaian Wanea', prefix: '11787', active: true, email: 'wanea@example.test' },
  { id: 'ranotana', name: 'Pegadaian Ranotana', prefix: '11793', active: true, email: 'ranotana@example.test' },
];

test('unit session rejects a Gadai customer outside its prefix before queuing', async () => {
  let queued = false;

  await assert.rejects(
    queueGadaiCustomers({
      session: { role: 'unit', unitPrefix: '11787' },
      customers: [{ sbg_number: '117930000001', phone_number: '0895803416704' }],
      template: 'jatuh-tempo',
      listUnitsImpl: async () => activeUnits,
      queueImpl: async () => { queued = true; },
    }),
    /tidak sesuai/i,
  );

  assert.equal(queued, false);
});

test('invalid phone rejects without substituting or queuing a target', async () => {
  let queued = false;

  await assert.rejects(
    queueInstallmentCustomers({
      session: { role: 'unit', unitPrefix: '11787' },
      customers: [{ account_number: '117870000001', phone_number: 'bukan nomor' }],
      template: 'keterlambatan',
      listUnitsImpl: async () => activeUnits,
      queueImpl: async () => { queued = true; },
    }),
    /nomor WhatsApp/i,
  );

  assert.equal(queued, false);
});

test('superadmin queues normalized Gadai recipient with a server-generated message', async () => {
  let queuedRecipients;
  const result = await queueGadaiCustomers({
    session: { role: 'superadmin', unitPrefix: null },
    customers: [{
      sbg_number: '1178726010000001',
      name: 'Brando Mathias Zusriadi',
      phone_number: '0895803416704',
      due_date: '2026-08-01',
      barang_jaminan: 'Emas',
      message: 'Pesan dari browser tidak boleh dipakai',
    }],
    template: 'jatuh-tempo',
    listUnitsImpl: async () => activeUnits,
    queueImpl: async ({ recipients }) => {
      queuedRecipients = recipients;
      return { accepted: recipients.length, reference: 'fonnte-test-1' };
    },
  });

  assert.deepEqual(result, { accepted: 1, reference: 'fonnte-test-1' });
  assert.equal(queuedRecipients.length, 1);
  assert.equal(queuedRecipients[0].target, '62895803416704');
  assert.equal(typeof queuedRecipients[0].message, 'string');
  assert.ok(queuedRecipients[0].message.length > 0);
  assert.doesNotMatch(queuedRecipients[0].message, /Pesan dari browser/i);
});

test('only active prefixes are returned for valid sessions', async () => {
  const units = [...activeUnits, { id: 'inactive', name: 'Lama', prefix: '11799', active: false, email: 'old@example.test' }];

  assert.deepEqual(
    await getAllowedPrefixes({ role: 'superadmin', unitPrefix: null }, { listUnitsImpl: async () => units }),
    ['11787', '11793'],
  );
  assert.deepEqual(
    await getAllowedPrefixes({ role: 'unit', unitPrefix: '11787' }, { listUnitsImpl: async () => units }),
    ['11787'],
  );
});

test('malformed session state cannot receive unit prefixes', async () => {
  await assert.rejects(
    getAllowedPrefixes(
      { role: 'superadmin', unitPrefix: '11787' },
      { listUnitsImpl: async () => activeUnits },
    ),
    /sesi unit/i,
  );
});
