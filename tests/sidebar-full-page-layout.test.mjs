import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [shell, sidebar, styles] = await Promise.all([
  readFile(new URL('../src/components/main-shell.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/ui/sidebar.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/main-shell.module.css', import.meta.url), 'utf8'),
]);

test('main shell sidebar stays fixed to the viewport while the page scrolls', () => {
  assert.match(shell, /<SidebarProvider className=\{cn\('naviga-shell', styles\.navigaShell\)\}/);
  assert.match(styles, /\.navigaSidebar\s*\{[\s\S]*position:\s*fixed;[\s\S]*inset-block:\s*0;[\s\S]*height:\s*100dvh;/);
});

test('main shell keeps a full-document visual rail behind the fixed sidebar', () => {
  assert.match(shell, /className=\{cn\('naviga-shell', styles\.navigaShell\)\}/);
  assert.match(sidebar, /className="group peer hidden min-h-svh self-stretch md:block text-sidebar-foreground"/);
  assert.match(sidebar, /relative h-full min-h-svh w-\[--sidebar-width\]/);
  assert.match(sidebar, /data-sidebar-track="true"/);
  assert.match(styles, /\.navigaShell\s*\{[\s\S]*display:\s*grid;[\s\S]*grid-template-columns:\s*var\(--sidebar-width\) minmax\(0, 1fr\);/);
  assert.match(styles, /\.navigaShell :global\(\[data-sidebar-track='true'\]\)\s*\{[\s\S]*height:\s*100%;[\s\S]*min-height:\s*100%;/);
  assert.match(styles, /\.navigaShell :global\(\[data-sidebar-track='true'\]\)::after/);
});

test('fixed sidebar content does not introduce a second surface over the document rail', () => {
  assert.match(styles, /\.navigaSidebar\s*\{[\s\S]*background:\s*transparent;[\s\S]*box-shadow:\s*none;/);
  assert.match(styles, /\.navigaSidebar :global\(\[data-sidebar='sidebar'\]\)\s*\{[\s\S]*border-color:\s*transparent;[\s\S]*background:\s*transparent;[\s\S]*box-shadow:\s*none;/);
  assert.match(styles, /:global\(\.dark\) \.navigaSidebar :global\(\[data-sidebar='sidebar'\]\)\s*\{[\s\S]*border-color:\s*transparent;[\s\S]*background:\s*transparent;[\s\S]*box-shadow:\s*none;/);
});
