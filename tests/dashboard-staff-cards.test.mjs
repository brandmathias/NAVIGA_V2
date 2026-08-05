import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('dashboard staff cards use the executive registry treatment without changing their data', async () => {
  const source = await readFile('src/app/(main)/dashboard/page.tsx', 'utf8');

  assert.match(source, /className="staff-registry-card" data-registry-role="penaksir"/);
  assert.match(source, /className="staff-registry-card" data-registry-role="pengelola"/);
  assert.match(source, /staff-registry-avatar/);
  assert.match(source, /staff-registry-role/);
  assert.match(source, /staff-registry-name/);
  assert.match(source, /staff-registry-nip/);
  assert.match(source, /profileData\.staff\.penaksir\.name/);
  assert.match(source, /profileData\.staff\.pengelola\.name/);
  assert.match(source, /profileData\.staff\.penaksir\.nip/);
  assert.match(source, /profileData\.staff\.pengelola\.nip/);
});

test('executive registry styling stays restrained, responsive, and motion-aware', async () => {
  const styles = await readFile('src/app/globals.css', 'utf8');

  assert.match(styles, /Hallmark · component: staff registry/);
  assert.match(styles, /\.staff-registry-card::before/);
  assert.match(styles, /\.staff-registry-card::after/);
  assert.match(styles, /@media \(hover: hover\) and \(pointer: fine\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(styles, /\.staff-registry-card[^}]*transition:\s*all/s);
});
