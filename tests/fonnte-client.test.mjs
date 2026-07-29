import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import fonnte from '../src/lib/fonnte-client.js';

const { getFonnteStatus, queueFonnteMessages } = fonnte;

function withFonnteEnvironment(values, run) {
  const previous = {
    FONNTE_ENABLED: process.env.FONNTE_ENABLED,
    FONNTE_TOKEN: process.env.FONNTE_TOKEN,
  };

  Object.assign(process.env, values);
  return Promise.resolve(run()).finally(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
}

test('queueFonnteMessages posts valid recipients as delayed Fonnte data', async () => {
  await withFonnteEnvironment({ FONNTE_ENABLED: 'true', FONNTE_TOKEN: 'test-token' }, async () => {
    let call;
    const result = await queueFonnteMessages({
      recipients: [
        { target: '6281234567890', message: 'Halo' },
        { target: '', message: 'Diabaikan' },
      ],
      fetchImpl: async (url, init) => {
        call = { url, init };
        return new Response(JSON.stringify({ status: true, id: ['fonnte-123'] }), { status: 200 });
      },
    });

    assert.equal(call.url, 'https://api.fonnte.com/send');
    assert.equal(call.init.method, 'POST');
    assert.equal(call.init.headers.Authorization, 'test-token');
    assert.deepEqual(JSON.parse(call.init.body.get('data')), [
      { target: '6281234567890', message: 'Halo', delay: '60' },
    ]);
    assert.deepEqual(result, { accepted: 1, reference: 'fonnte-123' });
    assert.deepEqual(getFonnteStatus(), { enabled: true });
  });
});

test('queueFonnteMessages rejects a successful HTTP response that Fonnte declined', async () => {
  await withFonnteEnvironment({ FONNTE_ENABLED: 'true', FONNTE_TOKEN: 'test-token' }, async () => {
    await assert.rejects(
      queueFonnteMessages({
        recipients: [{ target: '6281234567890', message: 'Halo' }],
        fetchImpl: async () => new Response(JSON.stringify({ status: false, reason: 'insufficient quota' }), { status: 200 }),
      }),
      /insufficient quota/i,
    );
  });
});

test('queueFonnteMessages rejects a successful HTTP response with invalid JSON', async () => {
  await withFonnteEnvironment({ FONNTE_ENABLED: 'true', FONNTE_TOKEN: 'test-token' }, async () => {
    await assert.rejects(
      queueFonnteMessages({
        recipients: [{ target: '6281234567890', message: 'Halo' }],
        fetchImpl: async () => new Response('not JSON', { status: 200 }),
      }),
      /respons Fonnte tidak valid/i,
    );
  });
});

test('queueFonnteMessages returns an unavailable result while Fonnte is disabled before calling fetch', async () => {
  await withFonnteEnvironment({ FONNTE_ENABLED: 'false', FONNTE_TOKEN: 'test-token' }, async () => {
    let called = false;

    const result = await queueFonnteMessages({
      recipients: [{ target: '6281234567890', message: 'Halo' }],
      fetchImpl: async () => { called = true; },
    });

    assert.equal(called, false);
    assert.deepEqual(result, { accepted: 0, unavailable: true });
    assert.deepEqual(getFonnteStatus(), { enabled: false });
  });
});

test('queueFonnteMessages returns an unavailable result when its token is missing before calling fetch', async () => {
  await withFonnteEnvironment({ FONNTE_ENABLED: 'true', FONNTE_TOKEN: '' }, async () => {
    let called = false;

    const result = await queueFonnteMessages({
      recipients: [{ target: '6281234567890', message: 'Halo' }],
      fetchImpl: async () => { called = true; },
    });

    assert.equal(called, false);
    assert.deepEqual(result, { accepted: 0, unavailable: true });
    assert.deepEqual(getFonnteStatus(), { enabled: false });
  });
});

test('Fonnte adapter carries the Next server-only import marker without loading it in Node tests', async () => {
  const source = await readFile(new URL('../src/lib/fonnte-client.js', import.meta.url), 'utf8');

  assert.match(source, /require\('server-only'\)/);
});
