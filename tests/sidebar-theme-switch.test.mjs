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
  assert.match(source, /startViewTransition/);
  assert.match(source, /viewTransition\.finished\.then\(finishTransition, finishTransition\)/);
  assert.match(source, /rapid second click can overlap/);
  assert.match(source, /transitionTimerRef\.current = window\.setTimeout\(finishTransition, 220\)/);
  assert.doesNotMatch(source, /requestAnimationFrame\(\(\) => \{\s*applyTheme\(nextTheme\)/s);
  assert.doesNotMatch(source, /thumbSun|thumbMoon/);
  assert.match(source, /className=\{styles\.iconStage\}/);
  assert.match(source, /className=\{styles\.moon\}/);
  assert.match(switchStyles, /width: 42px/);
  assert.match(switchStyles, /height: 42px/);
  assert.match(switchStyles, /place-items: center/);
  assert.match(switchStyles, /scale\(1\.18\)/);
  assert.match(switchStyles, /data-switching/);
  assert.match(switchStyles, /control::after/);
  assert.match(switchStyles, /scale\(1\.28\)/);
  assert.match(switchStyles, /data-state='loading'/);
  assert.match(switchStyles, /data-state='error'/);
  assert.match(switchStyles, /data-state='success'/);
  assert.match(switchStyles, /data-theme='dark'\] \.moon/);
  assert.match(switchStyles, /\.control:active/);
});

test('main shell keeps the Pegadaian logo without mounting a theme control', async () => {
  const shell = await readFile('src/components/main-shell.tsx', 'utf8');

  assert.doesNotMatch(shell, /ThemeSwitch/);
  assert.match(shell, /<Image src="\/PegadaianLogo\.png"/);
});

test('dark mode reaches shared page surfaces, popups, and the profile stylesheet', async () => {
  const [globalStyles, profileStyles, shellStyles, tasksPage] = await Promise.all([
    readFile('src/app/globals.css', 'utf8'),
    readFile('src/app/(main)/profile/profile.module.css', 'utf8'),
    readFile('src/components/main-shell.module.css', 'utf8'),
    readFile('src/app/(main)/tasks/page.tsx', 'utf8'),
  ]);

  assert.match(globalStyles, /--naviga-dark-surface:/);
  assert.match(globalStyles, /\[role='dialog'\]/);
  assert.match(globalStyles, /\[class\*="bg-white"\]/);
  assert.match(globalStyles, /html\[data-theme-transition='true'\]/);
  assert.match(globalStyles, /::view-transition-new\(root\)/);
  assert.doesNotMatch(globalStyles, /\.naviga-shell \*\s*,?\s*\[role='dialog'\]/);
  assert.match(globalStyles, /\.dark \.naviga-panel/);
  assert.match(globalStyles, /\.dark \.naviga-topbar/);
  assert.match(globalStyles, /\.dark \.naviga-shell :where\(button/);
  assert.match(globalStyles, /\.dark \.unit-hero h1/);
  assert.match(globalStyles, /\.dark :where\(\[role='dialog'\].*\) :where\(\[class\*="text/);
  assert.doesNotMatch(shellStyles, /:global\(\.dark\) :global\(\.naviga-topbar\)/);
  assert.match(profileStyles, /:global\(\.dark\) \.profilePage/);
  assert.match(tasksPage, /tasks-view-toggle/);
  assert.match(tasksPage, /data-active=\{viewMode === 'board'\}/);
});
