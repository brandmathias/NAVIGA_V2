import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const storageSourcePath = new URL('../src/lib/profile-photo-storage.ts', import.meta.url);

test('profile photo storage policy keeps the 5 MB browser-safe contract', async () => {
  const source = await readFile(storageSourcePath, 'utf8');

  assert.match(source, /MAX_PROFILE_PHOTO_SIZE\s*=\s*5\s*\*\s*1024\s*\*\s*1024/);
  assert.match(source, /image\/jpeg/);
  assert.match(source, /image\/png/);
  assert.match(source, /image\/webp/);
  assert.match(source, /indexedDB/);
  assert.match(source, /File tidak didukung/);
  assert.match(source, /Ukuran foto maksimal 5 MB/);
});
