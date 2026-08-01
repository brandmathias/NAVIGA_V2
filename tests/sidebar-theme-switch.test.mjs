import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('theme switch persists a browser preference and exposes an accessible switch', async () => {
  const [source, switchStyles] = await Promise.all([
    readFile('src/components/theme-switch.tsx', 'utf8'),
    readFile('src/components/theme-switch.module.css', 'utf8'),
  ]);

  assert.match(source, /localStorage\.setItem\('naviga-theme'/);
  assert.match(source, /role="switch"/);
  assert.match(source, /aria-label=\{isDark \? 'Aktifkan mode terang' : 'Aktifkan mode gelap'\}/);
  assert.match(source, /data-theme-transition/);
  assert.match(source, /root\.dataset\.themeTransition = 'true';\s*applyTheme\(nextTheme\);\s*transitionTimerRef\.current = window\.setTimeout/s);
  assert.doesNotMatch(source, /requestAnimationFrame\(\(\) => \{\s*applyTheme\(nextTheme\)/s);
  assert.doesNotMatch(source, /thumbSun|thumbMoon/);
  assert.match(switchStyles, /width: 100%/);
  assert.match(switchStyles, /max-width: 278px/);
  assert.match(switchStyles, /height: 88px/);
  assert.match(switchStyles, /grid-template-columns: 24px 70px 24px/);
  assert.match(switchStyles, /width: 70px/);
  assert.match(switchStyles, /height: 34px/);
  assert.match(switchStyles, /translateX\(36px\)/);
  assert.match(switchStyles, /\.control:active/);
});

test('main shell keeps the account card without mounting a theme switch control', async () => {
  const shell = await readFile('src/components/main-shell.tsx', 'utf8');

  assert.doesNotMatch(shell, /ThemeSwitch/);
  assert.match(shell, /<SidebarFooter[\s\S]*?<DropdownMenu>/s);
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
  assert.match(globalStyles, /\.dark \.unit-hero h1/);
  assert.match(globalStyles, /\.dark :where\(\[role='dialog'\].*\) :where\(\[class\*="text/);
  assert.doesNotMatch(shellStyles, /:global\(\.dark\) :global\(\.naviga-topbar\)/);
  assert.match(profileStyles, /:global\(\.dark\) \.profilePage/);
});
