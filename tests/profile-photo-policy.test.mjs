import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const storageSourcePath = new URL('../src/lib/profile-photo-storage.ts', import.meta.url);
const userPhotoRoutePath = new URL('../src/app/api/users/[userId]/photo/route.ts', import.meta.url);
const mainShellPath = new URL('../src/components/main-shell.tsx', import.meta.url);

test('profile photo policy keeps the 5 MB account-safe upload contract', async () => {
  const source = await readFile(storageSourcePath, 'utf8');

  assert.match(source, /MAX_PROFILE_PHOTO_SIZE\s*=\s*5\s*\*\s*1024\s*\*\s*1024/);
  assert.match(source, /image\/jpeg/);
  assert.match(source, /image\/png/);
  assert.match(source, /image\/webp/);
  assert.doesNotMatch(source, /indexedDB/);
  assert.match(source, /File tidak didukung/);
  assert.match(source, /Ukuran foto maksimal 5 MB/);
});

test('profile photos can be reused safely in sidebar and task creator avatars', async () => {
  const [routeSource, shellSource] = await Promise.all([
    readFile(userPhotoRoutePath, 'utf8'),
    readFile(mainShellPath, 'utf8'),
  ]);

  assert.match(routeSource, /canViewPhoto/);
  assert.match(routeSource, /viewer\.id === target\.id/);
  assert.match(routeSource, /viewer\.role === 'unit'/);
  assert.match(routeSource, /viewer\.unitId === target\.unitId/);
  assert.match(routeSource, /getProfilePhoto\(targetUserId\)/);
  assert.match(shellSource, /AvatarImage src=\{`\/api\/users\/\$\{encodeURIComponent\(user\.userId\)\}\/photo`\}/);
});
