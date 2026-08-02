import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const authSource = new URL('../src/lib/auth.mjs', import.meta.url);
const authRoute = new URL('../src/app/api/auth/[...all]/route.ts', import.meta.url);
const loginPage = new URL('../src/app/login/page.tsx', import.meta.url);

test('Better Auth owns PostgreSQL-backed email/password authentication', async () => {
  const source = await readFile(authSource, 'utf8');

  assert.match(source, /betterAuth/);
  assert.match(source, /new Pool/);
  assert.match(source, /emailAndPassword/);
  assert.match(source, /disableSignUp:\s*true/);
  assert.match(source, /admin\(/);
  assert.match(source, /adminAc, userAc/);
  assert.match(source, /roles:\s*\{\s*superadmin:\s*adminAc,\s*unit:\s*userAc\s*\}/s);
  assert.doesNotMatch(source, /NAVIGA_SESSION_SECRET/);
});

test('custom Better Auth roles preserve the admin permission boundary', async () => {
  const { adminAc, userAc } = await import('better-auth/plugins/admin/access');

  assert.equal(adminAc.authorize({ user: ['update'] }).success, true);
  assert.equal(adminAc.authorize({ user: ['set-password'] }).success, true);
  assert.equal(userAc.authorize({ user: ['update'] }).success, false);
  assert.equal(userAc.authorize({ user: ['set-password'] }).success, false);
});

test('Next routes authentication through Better Auth and login uses its client', async () => {
  const [route, login] = await Promise.all([readFile(authRoute, 'utf8'), readFile(loginPage, 'utf8')]);

  assert.match(route, /toNextJsHandler\(auth\)/);
  assert.match(login, /authClient\.signIn\.email/);
  assert.doesNotMatch(login, /\/api\/auth\/login/);
});
