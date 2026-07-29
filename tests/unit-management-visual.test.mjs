import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

test('unit management matches the operational hierarchy and keeps complete unit and admin fields reachable', async () => {
  const [page, shell, styles] = await Promise.all([
    readFile('src/app/(main)/unit-management/unit-management-client.tsx', 'utf8'),
    readFile('src/components/main-shell.tsx', 'utf8'),
    readFile('src/app/globals.css', 'utf8'),
  ]);

  await access('public/unit-management-hero.png');
  assert.match(styles, /unit-management-hero\.png/);
  assert.doesNotMatch(styles, /\.unit-hero::before/);
  assert.match(styles, /background-size:\s*cover,\s*cover/);
  assert.match(styles, /background-position:\s*center,\s*right 85%/);
  assert.match(page, /data-testid="unit-registration"/);
  assert.match(page, /data-testid="admin-registration"/);
  assert.match(page, /Tambah akun admin unit/);
  assert.match(page, /Pilih unit terkait/);
  assert.match(page, /<Select name="unitId"/);
  assert.match(page, /unit-admin-dialog/);
  assert.match(page, /unit-admin-select-content/);
  assert.match(page, /unit-admin-info/);
  assert.match(page, /Simpan/);
  assert.match(styles, /\.unit-admin-dialog\s*\{/);
  assert.match(styles, /\.unit-admin-select-trigger\[data-state="open"\]/);
  assert.match(styles, /\.unit-admin-select-content\s*\{/);
  assert.match(styles, /\.unit-admin-select-item\[data-highlighted\]/);
  assert.match(page, /Domisili/);
  assert.match(page, /Nomor telepon/);
  assert.match(page, /Nama admin/);
  assert.match(page, /unit-hero-copy/);
  assert.match(page, /unit-hero-stats/);
  assert.match(page, /Unit terdaftar/);
  assert.match(page, /Akun admin/);
  assert.match(page, /unit-hero-stat-icon/);
  assert.match(page, /unit-hero-stat-copy/);
  assert.doesNotMatch(page, /unit-hero-stat-divider/);
  assert.match(page, /unit-management-content/);
  assert.doesNotMatch(page, /unit aktif/);
  assert.match(styles, /\.unit-management-content > aside\s*\{\s*display:\s*none/);
  assert.match(styles, /\.unit-hero-stat\s*\{/);
  assert.match(styles, /\.unit-hero-stat-icon\s*\{[\s\S]*?background:\s*#008d84/);
  assert.match(styles, /\.unit-hero-secondary\s*\{[\s\S]*?background:\s*rgba\(255, 255, 255, \.48\) !important/);
  assert.match(styles, /\.unit-hero-primary\s*\{[\s\S]*?background:\s*rgba\(0, 112, 105, \.43\) !important/);
  assert.match(styles, /--background:\s*0 0% 100%/);
  assert.match(styles, /--sidebar-background:\s*192 56% 98%/);
  assert.match(styles, /\.naviga-topbar\[data-scrolled="true"\]\s*\{[\s\S]*?background:\s*#ffffff/);
  assert.match(styles, /\.naviga-panel\s*\{[\s\S]*?background:\s*#ffffff[\s\S]*?box-shadow:\s*inset 0 1px 0 rgba\(255,255,255,\.9\)/);
  assert.match(shell, /'--sidebar-width': '19rem'/);
  assert.match(shell, /<Sidebar variant="floating"/);
  assert.ok(shell.indexOf("router.push('/unit-management')") < shell.indexOf("router.push('/history')"));
  assert.match(shell, /min-w-0/);
  assert.match(shell, /truncate/);
});
