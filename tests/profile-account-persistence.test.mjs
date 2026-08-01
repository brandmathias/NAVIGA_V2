import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const profilePagePath = new URL('../src/app/(main)/profile/page.tsx', import.meta.url);
const profileStylesPath = new URL('../src/app/(main)/profile/profile.module.css', import.meta.url);
const photoStoragePath = new URL('../src/lib/profile-photo-storage.ts', import.meta.url);
const authSourcePath = new URL('../src/lib/auth.mjs', import.meta.url);
const preciseLocationRoutePath = new URL('../src/app/api/profile/login-location/route.ts', import.meta.url);

test('profile page persists photos through the account API instead of browser storage', async () => {
  const [profilePage, photoStorage] = await Promise.all([
    readFile(profilePagePath, 'utf8'),
    readFile(photoStoragePath, 'utf8'),
  ]);

  assert.doesNotMatch(photoStorage, /indexedDB/);
  assert.match(profilePage, /fetch\(['"]\/api\/profile\/photo/);
});

test('profile page exposes Better Auth password changes', async () => {
  const profilePage = await readFile(profilePagePath, 'utf8');

  assert.match(profilePage, /authClient\.changePassword/);
  assert.match(profilePage, /currentPassword/);
  assert.match(profilePage, /newPassword/);
});

test('login sessions are recorded and displayed as account history', async () => {
  const [profilePage, authSource] = await Promise.all([
    readFile(profilePagePath, 'utf8'),
    readFile(authSourcePath, 'utf8'),
  ]);

  assert.match(authSource, /databaseHooks/);
  assert.match(authSource, /naviga_login_history/);
  assert.match(authSource, /userAgent/);
  assert.match(authSource, /ipAddress/);
  assert.match(profilePage, /\/api\/profile\/login-history/);
  assert.match(profilePage, /Riwayat Login/);
});

test('login history replaces a missing localhost IP and shows its network location', async () => {
  const [profilePage, authSource] = await Promise.all([
    readFile(profilePagePath, 'utf8'),
    readFile(authSourcePath, 'utf8'),
  ]);

  assert.match(authSource, /COALESCE\(NULLIF\(ip_address, ''\), '127\.0\.0\.1'\)/);
  assert.match(authSource, /Lingkungan lokal/);
  assert.match(profilePage, /item\.location/);
  assert.match(profilePage, /IP \{item\.ipAddress\}/);
});

test('profile enriches the active login with the browser public IP and city', async () => {
  const [profilePage, authSource] = await Promise.all([
    readFile(profilePagePath, 'utf8'),
    readFile(authSourcePath, 'utf8'),
  ]);

  assert.match(profilePage, /https:\/\/ipwho\.is\//);
  assert.match(profilePage, /\/api\/profile\/login-context/);
  assert.match(authSource, /updateCurrentLoginNetwork/);
  assert.match(authSource, /city/);
  assert.match(authSource, /region/);
});

test('login history keeps device, time, location, and long IP addresses readable', async () => {
  const [profilePage, profileStyles] = await Promise.all([
    readFile(profilePagePath, 'utf8'),
    readFile(profileStylesPath, 'utf8'),
  ]);

  assert.match(profilePage, /<time dateTime=\{item\.loggedInAt\}>/);
  assert.match(profilePage, /styles\.historyLocation/);
  assert.match(profileStyles, /\.loginHistoryItem\s*\{[^}]*grid-template-columns:\s*auto minmax\(0, 1fr\)/s);
  assert.match(profileStyles, /\.historyLocation\s*\{[^}]*overflow-wrap:\s*anywhere/s);
  assert.doesNotMatch(profileStyles, /\.historyCopy strong,\s*\.historyCopy span\s*\{[^}]*text-overflow:\s*ellipsis/s);
});

test('login history records a consented high-accuracy device location before falling back to IP', async () => {
  const [profilePage, authSource, locationRoute] = await Promise.all([
    readFile(profilePagePath, 'utf8'),
    readFile(authSourcePath, 'utf8'),
    readFile(preciseLocationRoutePath, 'utf8'),
  ]);

  assert.match(profilePage, /enableHighAccuracy:\s*true/);
  assert.match(profilePage, /navigator\.geolocation\.watchPosition/);
  assert.match(profilePage, /accuracy\s*<=\s*30/);
  assert.match(profilePage, /\/api\/profile\/login-location/);
  assert.match(authSource, /location_source/);
  assert.match(authSource, /location_accuracy_meters/);
  assert.match(authSource, /updateCurrentLoginLocation/);
  assert.match(locationRoute, /nominatim\.openstreetmap\.org\/reverse/);
  assert.match(locationRoute, /zoom=18/);
  assert.match(locationRoute, /User-Agent/);
  assert.match(locationRoute, /address\.region/);
  assert.match(locationRoute, /geocode\?\.display_name/);
});
