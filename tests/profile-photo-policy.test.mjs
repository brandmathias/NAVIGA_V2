import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const storageSourcePath = new URL('../src/lib/profile-photo-storage.ts', import.meta.url);
const userPhotoRoutePath = new URL('../src/app/api/users/[userId]/photo/route.ts', import.meta.url);
const mainShellPath = new URL('../src/components/main-shell.tsx', import.meta.url);
const mainShellStylesPath = new URL('../src/components/main-shell.module.css', import.meta.url);

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
  const [routeSource, shellSource, shellStyles] = await Promise.all([
    readFile(userPhotoRoutePath, 'utf8'),
    readFile(mainShellPath, 'utf8'),
    readFile(mainShellStylesPath, 'utf8'),
  ]);

  assert.match(routeSource, /canViewPhoto/);
  assert.match(routeSource, /viewer\.id === target\.id/);
  assert.match(routeSource, /viewer\.role === 'unit'/);
  assert.match(routeSource, /viewer\.unitId === target\.unitId/);
  assert.match(routeSource, /getProfilePhoto\(targetUserId\)/);
  assert.match(shellSource, /AvatarImage src=\{`\/api\/users\/\$\{encodeURIComponent\(user\.userId\)\}\/photo`\}/);
  assert.match(shellSource, /aria-label=\{`Buka menu akun \$\{user\.name\}`\}/);
  assert.match(shellSource, /naviga-sidebar-profile-name/);
  assert.match(shellSource, /naviga-sidebar-profile-email/);
  assert.match(shellSource, /naviga-sidebar-profile-chevron/);
  assert.doesNotMatch(shellSource, /Akun aktif/);
  assert.doesNotMatch(shellSource, /accountRoleLabel/);
  assert.doesNotMatch(shellSource, /bg-\[#f7fbfa\]/);
  assert.doesNotMatch(shellSource, /bg-\[#eef9f5\]/);
  assert.match(shellSource, /naviga-sidebar-profile-plaque/);
  assert.match(shellSource, /text-\[#123b47\]/);
  assert.doesNotMatch(shellSource, /bg-\[#0d4650\]/);
  assert.match(shellSource, /relative z-\[1\] ml-1/);
  assert.match(shellSource, /naviga-sidebar-profile-chevron/);
  assert.match(shellSource, /bg-\[#fbfdfb\]/);
  assert.match(shellSource, /naviga-sidebar-profile-name block whitespace-nowrap overflow-visible/);
  assert.match(shellSource, /naviga-sidebar-profile-email mt-0\.5 block whitespace-nowrap overflow-visible/);
  assert.doesNotMatch(shellSource, /naviga-sidebar-profile-(?:name|email)[^\n]*truncate/);
  assert.match(shellStyles, /naviga-sidebar-profile\[data-state='open'\]/);
  assert.match(shellStyles, /naviga-sidebar-profile:focus-visible/);
  assert.match(shellStyles, /naviga-sidebar-profile\[data-disabled\]/);
  assert.match(shellStyles, /naviga-sidebar-profile::before/);
  assert.match(shellStyles, /naviga-sidebar-profile::after/);
  assert.match(shellStyles, /naviga-sidebar-profile-corner/);
  assert.match(shellStyles, /naviga-sidebar-profile-rail/);
  assert.match(shellStyles, /--profile-avatar-ring/);
  assert.match(shellStyles, /left: 0\.25rem/);
  assert.doesNotMatch(shellStyles, /left: 0\.55rem/);
  assert.match(shellStyles, /--profile-paper/);
  assert.match(shellStyles, /text-overflow: clip/);
  assert.match(shellStyles, /overflow: visible/);
  assert.match(shellStyles, /prefers-reduced-motion/);
});
