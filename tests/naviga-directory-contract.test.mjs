import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const directorySource = new URL('../src/lib/naviga-directory.mjs', import.meta.url);

test('unit and account directory persists in PostgreSQL and provisions Better Auth users', async () => {
  const source = await readFile(directorySource, 'utf8');

  assert.match(source, /naviga_units/);
  assert.match(source, /auth\.api\.createUser/);
  assert.match(source, /auth\.api\.setUserPassword/);
  assert.match(source, /bootstrapDirectory/);
  assert.match(source, /deleteUnitAdmin/);
  assert.match(source, /SET banned = true/);
  assert.match(source, /u\.banned IS NOT TRUE/);
  assert.doesNotMatch(source, /writeFile\(|rename\(/);
});
