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

test('sidebar keeps all labels visible in a compact shell with a light initial avatar', async () => {
  const shell = await readFile('src/components/main-shell.tsx', 'utf8');

  assert.match(shell, /h-\[100px\]/);
  assert.doesNotMatch(shell, /h-\[166px\]/);
  assert.match(shell, /whitespace-normal/);
  assert.match(shell, /AvatarFallback className="bg-white/);
  assert.match(shell, /text-\[#087f76\]/);
});
