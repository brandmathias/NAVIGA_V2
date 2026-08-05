import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('gadaian and angsuran broadcast panels disable card hover motion', async () => {
  const [gadaian, angsuran] = await Promise.all([
    readFile('src/app/(main)/pdf-broadcast/page.tsx', 'utf8'),
    readFile('src/app/(main)/xlsx-broadcast/page.tsx', 'utf8'),
  ]);

  assert.match(gadaian, /<MotionCard delay=\{0\.06\} disableHover>/);
  assert.match(angsuran, /<MotionCard delay=\{0\.06\} disableHover>/);
});
