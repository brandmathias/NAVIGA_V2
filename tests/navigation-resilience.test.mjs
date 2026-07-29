import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('unit-management navigation remains available before client hydration', async () => {
  const [management, create] = await Promise.all([
    readFile('src/app/(main)/unit-management/unit-management-client.tsx', 'utf8'),
    readFile('src/app/(main)/unit-management/new/unit-create-client.tsx', 'utf8'),
  ]);

  assert.match(management, /<Link href="\/unit-management\/new"/);
  assert.match(management, /onClick=\{\(\) => setIsAdminDialogOpen\(true\)\}/);
  assert.doesNotMatch(management, /href="\/unit-management\/new\?mode=admin"/);
  assert.match(create, /<Link href="\/unit-management"/);
});
