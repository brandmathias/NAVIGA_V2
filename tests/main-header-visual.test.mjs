import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('main header drops artwork and becomes translucent after the page scrolls', async () => {
  const [shell, styles] = await Promise.all([
    readFile('src/components/main-shell.tsx', 'utf8'),
    readFile('src/app/globals.css', 'utf8'),
  ]);

  assert.doesNotMatch(styles, /naviga-control-center-bg\.png/);
  assert.match(styles, /\.naviga-topbar\[data-scrolled="true"\]/);
  assert.match(styles, /background-color:\s*rgb\(255 255 255 \/ var\(--naviga-glass-alpha\)\)/);
  assert.match(styles, /backdrop-filter:\s*blur\(var\(--naviga-glass-blur\)\) saturate\(1\.08\)/);
  assert.match(shell, /const \[isScrolled, setIsScrolled\]/);
  assert.match(shell, /const getScrollTop = \(\) =>/);
  assert.match(shell, /document\.scrollingElement \?\? document\.documentElement/);
  assert.match(shell, /window\.addEventListener\('scroll', updateScroll/);
  assert.match(shell, /document\.addEventListener\('scroll', updateScroll/);
  assert.match(shell, /data-scrolled=\{isScrolled \? 'true' : 'false'\}/);
  assert.match(shell, /h-\[94px\]/);
  assert.match(shell, /text-\[#003f46\]/);
  assert.match(shell, /h-\[50px\] w-auto/);
  assert.doesNotMatch(shell, /h-auto w-\[124px\]/);
  assert.doesNotMatch(shell, /brightness-0 invert/);
});

test('sidebar reference treatment and unit header copy remain role-aware', async () => {
  const [shell, shellStyles] = await Promise.all([
    readFile('src/components/main-shell.tsx', 'utf8'),
    readFile('src/components/main-shell.module.css', 'utf8'),
  ]);

  assert.match(shell, /const isUnitUser = user\.role === 'unit';/);
  assert.match(shell, /headerTitle = isUnitUser \? `\$\{unitName\} Control Center`/);
  assert.match(shell, /Kelola tugas, jatuh tempo broadcast, dan riwayat operasional \$\{unitName\}/);
  assert.doesNotMatch(shell, /isUnitUser \? `\$\{unitName\} Operations Center`/);
  assert.match(shell, /naviga-sidebar-brand/);
  assert.match(shellStyles, /\.naviga-sidebar-menu-button/);
  assert.match(shellStyles, /@media \(prefers-reduced-motion: reduce\)/);
});
