import test from 'node:test';
import assert from 'node:assert/strict';
import piper from '../src/lib/piper-tts.js';

const { synthesizePiperWav } = piper;
const wavBytes = new Uint8Array([82, 73, 70, 70, 36, 0, 0, 0, 87, 65, 86, 69]);

test('synthesizePiperWav posts text to the local Piper endpoint and returns a WAV data URI', async () => {
  const result = await synthesizePiperWav('Selamat pagi', {
    fetchImpl: async () => new Response(wavBytes, {
      status: 200,
      headers: { 'content-type': 'audio/wav' },
    }),
  });

  assert.equal(result, 'data:audio/wav;base64,UklGRiQAAABXQVZF');
});

test('synthesizePiperWav accepts a valid WAV when Piper omits the audio content type', async () => {
  const result = await synthesizePiperWav('Selamat pagi', {
    fetchImpl: async () => new Response(wavBytes, {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    }),
  });

  assert.equal(result, 'data:audio/wav;base64,UklGRiQAAABXQVZF');
});

test('synthesizePiperWav rejects a successful response that is not a WAV file', async () => {
  await assert.rejects(
    synthesizePiperWav('Selamat pagi', {
      fetchImpl: async () => new Response('not audio', {
        status: 200,
        headers: { 'content-type': 'text/plain' },
      }),
    }),
    /format WAV/i,
  );
});

test('synthesizePiperWav reports an unavailable local Piper service', async () => {
  await assert.rejects(
    synthesizePiperWav('Selamat pagi', {
      fetchImpl: async () => {
        throw new TypeError('fetch failed');
      },
    }),
    /Piper tidak dapat dihubungi/i,
  );
});

test('synthesizePiperWav reports a local Piper timeout', async () => {
  await assert.rejects(
    synthesizePiperWav('Selamat pagi', {
      timeoutMs: 1,
      fetchImpl: async (_url, init) => new Promise((_resolve, reject) => {
        init.signal.addEventListener('abort', () => reject(new DOMException('Timed out', 'AbortError')));
      }),
    }),
    /Piper tidak merespons sebelum batas waktu habis/i,
  );
});
