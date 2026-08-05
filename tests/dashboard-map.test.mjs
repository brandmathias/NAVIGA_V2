import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const { getGoogleMapsEmbedUrl } = require('../src/lib/google-maps.js');

test('turns a saved Google Maps share link into a usable embed URL', () => {
  const embedUrl = getGoogleMapsEmbedUrl(
    'https://maps.app.goo.gl/rThjjPo14ZqcQMbr8',
    'Jl. Sam Ratulangi No.400, Ranotana, Manado',
  );
  const parsed = new URL(embedUrl);

  assert.equal(parsed.origin, 'https://maps.google.com');
  assert.equal(parsed.searchParams.get('q'), 'Jl. Sam Ratulangi No.400, Ranotana, Manado');
  assert.equal(parsed.searchParams.get('output'), 'embed');
});

test('keeps an existing Google Maps embed URL unchanged', () => {
  const embedUrl = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1';

  assert.equal(getGoogleMapsEmbedUrl(embedUrl, 'Alamat unit'), embedUrl);
});

test('does not put an unrelated URL into the map iframe', () => {
  assert.equal(getGoogleMapsEmbedUrl('https://example.com/location', 'Alamat unit'), '');
  assert.equal(getGoogleMapsEmbedUrl('https://www.google.com/search?q=unit', 'Alamat unit'), '');
});

test('dashboard normalizes the saved Google Maps link before rendering its iframe', async () => {
  const source = await readFile('src/app/(main)/dashboard/page.tsx', 'utf8');

  assert.match(source, /getGoogleMapsEmbedUrl\(profileData\.mapUrl, profileData\.address\)/);
  assert.match(source, /src=\{activeMapUrl\}/);
  assert.match(source, /mapUrl: session\.unitMapUrl \|\| baseProfile\.mapUrl/);
});

test('dashboard keeps the existing unit operating hours while the map source changes', async () => {
  const source = await readFile('src/app/(main)/dashboard/page.tsx', 'utf8');

  assert.match(source, /operatingHours: 'Senin - Jumat: 08:00 - 15\.30 dan Sabtu: 08:00 - 12:30'/);
  assert.match(source, /<span>\{profileData\.operatingHours\}<\/span>/);
});
