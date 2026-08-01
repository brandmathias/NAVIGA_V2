import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('sidebar routes use links while the broadcast trigger remains an action', async () => {
  const shell = await readFile('src/components/main-shell.tsx', 'utf8');

  assert.match(shell, /import Link from 'next\/link';/);
  assert.match(shell, /<SidebarMenuButton asChild className=\{menuButtonClassName\}[\s\S]*?>\s*<Link href="\/dashboard">/);
  assert.match(shell, /<Link href="\/unit-management">/);
  assert.match(shell, /<Link href="\/history">/);
  assert.match(shell, /<DropdownMenuTrigger asChild>/);
});

test('sidebar uses a compact brand header with a legible logo lockup and light initial avatar', async () => {
  const shell = await readFile('src/components/main-shell.tsx', 'utf8');

  assert.match(shell, /h-20 shrink-0/);
  assert.match(shell, /width=\{44\} height=\{44\} className="h-11 w-11 shrink-0"/);
  assert.match(shell, /text-\[26px\] font-medium/);
  assert.match(shell, /whitespace-normal/);
  assert.match(shell, /AvatarFallback className="bg-white/);
  assert.match(shell, /text-\[#087f76\]/);
});
