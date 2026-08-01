import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('theme switch persists a browser preference and exposes an accessible switch', async () => {
  const source = await readFile('src/components/theme-switch.tsx', 'utf8');

  assert.match(source, /localStorage\.setItem\('naviga-theme'/);
  assert.match(source, /role="switch"/);
  assert.match(source, /aria-label="Aktifkan mode gelap"/);
  assert.match(source, /data-theme-transition/);
});

test('main shell places the theme control directly before the account card', async () => {
  const shell = await readFile('src/components/main-shell.tsx', 'utf8');

  assert.match(shell, /<ThemeSwitch\s*\/>\s*<DropdownMenu>/s);
});

test('dark mode reaches shared page surfaces, popups, and the profile stylesheet', async () => {
  const [globalStyles, profileStyles, shellStyles] = await Promise.all([
    readFile('src/app/globals.css', 'utf8'),
    readFile('src/app/(main)/profile/profile.module.css', 'utf8'),
    readFile('src/components/main-shell.module.css', 'utf8'),
  ]);

  assert.match(globalStyles, /--naviga-dark-surface:/);
  assert.match(globalStyles, /\[role='dialog'\]/);
  assert.match(globalStyles, /\[class\*="bg-white"\]/);
  assert.match(globalStyles, /html\[data-theme-transition='true'\]/);
  assert.match(globalStyles, /\.dark \.naviga-topbar/);
  assert.match(globalStyles, /\.dark \.naviga-shell :where\(button/);
  assert.doesNotMatch(shellStyles, /:global\(\.dark\) :global\(\.naviga-topbar\)/);
  assert.match(profileStyles, /:global\(\.dark\) \.profilePage/);
});
