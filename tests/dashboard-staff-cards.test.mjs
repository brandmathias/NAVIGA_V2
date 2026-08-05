import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('dashboard staff cards keep a compact horizontal layout without changing their data', async () => {
  const source = await readFile('src/app/(main)/dashboard/page.tsx', 'utf8');

  assert.match(source, /className="staff-registry-card[^"]*"\s+data-registry-role="penaksir"/);
  assert.match(source, /className="staff-registry-card[^"]*"\s+data-registry-role="pengelola"/);
  assert.equal(
    source.match(/className="staff-registry-layout flex flex-row items-center gap-4 space-y-0 p-4 pr-5"/g)?.length,
    2,
  );
  assert.equal(source.match(/staff-registry-card group rounded-full/g)?.length, 2);
  assert.match(source, /staff-registry-avatar/);
  assert.match(source, /staff-registry-role/);
  assert.match(source, /staff-registry-name/);
  assert.match(source, /staff-registry-nip/);
  assert.match(source, /profileData\.staff\.penaksir\.name/);
  assert.match(source, /profileData\.staff\.pengelola\.name/);
  assert.match(source, /profileData\.staff\.penaksir\.nip/);
  assert.match(source, /profileData\.staff\.pengelola\.nip/);
});

test('dashboard profile lifts the map into a compact responsive split', async () => {
  const source = await readFile('src/app/(main)/dashboard/page.tsx', 'utf8');
  const styles = await readFile('src/app/globals.css', 'utf8');

  assert.match(source, /dashboard-profile-grid grid items-stretch gap-5 p-4 sm:p-5 lg:grid-cols-\[minmax\(0,1fr\)_minmax\(24rem,0\.95fr\)\]/);
  assert.match(source, /dashboard-map-frame relative overflow-hidden rounded-xl border/);
  assert.match(styles, /\.dashboard-map-frame\s*\{[^}]*height:\s*clamp\(14rem, 30dvh, 17rem\)/s);
  assert.doesNotMatch(source, /dashboard-map-frame[^"\n]*aspect-video/);
});

test('dashboard gives the profile more room while preserving the compact staff cards', async () => {
  const source = await readFile('src/app/(main)/dashboard/page.tsx', 'utf8');
  const styles = await readFile('src/app/globals.css', 'utf8');

  assert.match(source, /className="flex min-h-screen w-full flex-col bg-background lg:min-h-0"/);
  assert.match(source, /<main className="dashboard-main /);
  assert.equal(source.match(/staff-registry-card group rounded-full/g)?.length, 2);
  assert.equal(
    source.match(/staff-registry-layout flex flex-row items-center gap-4 space-y-0 p-4 pr-5/g)?.length,
    2,
  );
  assert.match(styles, /@media \(min-width: 1024px\) and \(min-height: 720px\)/);
  assert.match(styles, /\.dashboard-main\s*\{[^}]*height:\s*calc\(100dvh - 5\.875rem\)[^}]*overflow-y:\s*hidden/s);
  assert.match(styles, /\.dashboard-map-frame\s*\{[^}]*height:\s*clamp\(22rem, 54dvh, 29rem\)/s);
  assert.doesNotMatch(styles, /\.staff-registry-layout\s*\{[^}]*min-height:/s);
});

test('staff registry styling stays stripe-free while responding to pointer interaction', async () => {
  const styles = await readFile('src/app/globals.css', 'utf8');
  const registryStyles = styles
    .split('/* Hallmark · component: staff registry')[1]
    .split('/* Hallmark · component: admin-account dialog')[0];

  assert.match(styles, /Hallmark · component: staff registry/);
  assert.doesNotMatch(registryStyles, /\.staff-registry-card::before/);
  assert.doesNotMatch(registryStyles, /\.staff-registry-card::after/);
  assert.match(registryStyles, /\.staff-registry-card:hover \.staff-registry-avatar/);
  assert.match(registryStyles, /\.staff-registry-card:hover \.staff-registry-role::before/);
  assert.match(registryStyles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(registryStyles, /text-transform:\s*uppercase/);
  assert.doesNotMatch(registryStyles, /\.staff-registry-card[^}]*transition:\s*all/s);
});
