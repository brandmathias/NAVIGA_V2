import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('successful login redirects once without refreshing the login page', async () => {
  const page = await readFile('src/app/login/page.tsx', 'utf8');
  const successFlow = page.slice(page.indexOf("toast({ title: 'Login Berhasil'"), page.indexOf('    } catch'));

  assert.match(successFlow, /router\.replace\('\/dashboard'\)/);
  assert.doesNotMatch(successFlow, /router\.refresh\(\)/);
});
