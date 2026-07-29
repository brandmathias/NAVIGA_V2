import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

test('unit management matches the operational hierarchy and keeps complete unit and admin fields reachable', async () => {
  const [page, createPage, shell, styles] = await Promise.all([
    readFile('src/app/(main)/unit-management/unit-management-client.tsx', 'utf8'),
    readFile('src/app/(main)/unit-management/new/unit-create-client.tsx', 'utf8'),
    readFile('src/components/main-shell.tsx', 'utf8'),
    readFile('src/app/globals.css', 'utf8'),
  ]);

  await access('public/unit-management-hero.png');
  assert.match(styles, /unit-management-hero\.png/);
  assert.doesNotMatch(styles, /\.unit-hero::before/);
  assert.match(styles, /background-size:\s*cover,\s*cover/);
  assert.match(styles, /background-position:\s*center,\s*right 85%/);
  assert.match(page, /router\.push\('\/unit-management\/new'\)/);
  assert.match(page, /router\.push\('\/unit-management\/new\?mode=admin'\)/);
  assert.match(createPage, /Tambah akun admin unit/);
  assert.match(createPage, /Pilih unit terkait/);
  assert.match(createPage, /<Select name="unitId"/);
  assert.match(createPage, /name="prefix"/);
  assert.match(createPage, /pattern="\[0-9\]\{5\}"/);
  assert.match(createPage, /formatUnitCode\(domicile, prefix\)/);
  assert.match(createPage, /router\.push\('\/unit-management'\)/);
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
  assert.match(page, /unit-hero-actions/);
  assert.ok(page.indexOf('unit-hero-stats') < page.indexOf('unit-hero-actions'));
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
  assert.match(styles, /\.unit-hero-secondary\s*\{[\s\S]*?background:\s*rgba\(255, 255, 255, \.92\) !important/);
  assert.match(styles, /\.unit-hero-primary\s*\{[\s\S]*?background:\s*rgba\(0, 112, 105, \.88\) !important/);
  assert.match(styles, /\.unit-hero-primary:hover\s*\{[\s\S]*?background:\s*rgba\(0, 126, 118, \.43\) !important/);
  assert.match(styles, /\.unit-hero-secondary:hover\s*\{[\s\S]*?background:\s*rgba\(226, 252, 248, \.18\) !important/);
  assert.match(styles, /--background:\s*0 0% 100%/);
  assert.match(styles, /--sidebar-background:\s*192 56% 98%/);
  assert.match(styles, /\.naviga-topbar\[data-scrolled="true"\]\s*\{[\s\S]*?background:\s*rgba\(255, 255, 255, \.62\)/);
  assert.match(styles, /\.naviga-panel\s*\{[\s\S]*?background:\s*#ffffff[\s\S]*?box-shadow:\s*inset 0 1px 0 rgba\(255,255,255,\.9\)/);
  assert.match(shell, /'--sidebar-width': '19rem'/);
  assert.match(shell, /<Sidebar variant="floating"/);
  assert.ok(shell.indexOf("router.push('/unit-management')") < shell.indexOf("router.push('/history')"));
  assert.match(shell, /min-w-0/);
  assert.match(shell, /truncate/);
  assert.match(shell, /NAV<span className="text-\[#0aa99c\]">IGA<\/span>/);
  assert.match(shell, /gap-2 text-\[#003f46\] transition-transform/);
});
