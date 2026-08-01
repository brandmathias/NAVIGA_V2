import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

test('loads Plus Jakarta Sans as the global NAVIGA font', async () => {
  const layout = await readFile(new URL('../src/app/layout.tsx', import.meta.url), 'utf8');
  const tailwind = await readFile(new URL('../tailwind.config.ts', import.meta.url), 'utf8');

  assert.match(layout, /family=Plus\+Jakarta\+Sans/);
  assert.match(tailwind, /body: \['Plus Jakarta Sans', 'sans-serif'\]/);
  assert.match(tailwind, /headline: \['Plus Jakarta Sans', 'sans-serif'\]/);
});
