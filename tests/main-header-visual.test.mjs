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
  assert.match(styles, /background: #ffffff/);
  assert.match(styles, /backdrop-filter: blur\(14px\)/);
  assert.match(shell, /const \[isScrolled, setIsScrolled\]/);
  assert.match(shell, /window\.addEventListener\('scroll', updateScroll/);
  assert.match(shell, /data-scrolled=\{isScrolled \? 'true' : 'false'\}/);
  assert.match(shell, /h-\[94px\]/);
  assert.match(shell, /text-\[#003f46\]/);
  assert.match(shell, /h-\[50px\] w-auto/);
  assert.doesNotMatch(shell, /h-auto w-\[124px\]/);
  assert.doesNotMatch(shell, /brightness-0 invert/);
});
