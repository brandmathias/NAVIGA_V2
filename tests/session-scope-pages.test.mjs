import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const scopedPages = [
  'src/app/(main)/tasks/page.tsx',
  'src/app/(main)/history/page.tsx',
  'src/app/(main)/pdf-broadcast/page.tsx',
  'src/app/(main)/xlsx-broadcast/page.tsx',
];

test('authenticated pages derive their UPC from the signed session context', async () => {
  for (const file of scopedPages) {
    const source = await readFile(file, 'utf8');
    assert.match(source, /useLocalSession/);
    assert.doesNotMatch(source, /localStorage\.getItem\('loggedInUser'\)/);
  }
});

test('unit management is guarded server-side for Superadmin sessions', async () => {
  const [pageSource, actionSource, clientSource] = await Promise.all([
    readFile('src/app/(main)/unit-management/page.tsx', 'utf8'),
    readFile('src/app/(main)/unit-management/actions.ts', 'utf8'),
    readFile('src/app/(main)/unit-management/unit-management-client.tsx', 'utf8'),
  ]);

  assert.match(pageSource, /getSession/);
  assert.match(pageSource, /session\.role !== 'superadmin'/);
  assert.match(pageSource, /listUnits/);
  assert.match(actionSource, /requireSession/);
  assert.match(actionSource, /session\.role !== 'superadmin'/);
  assert.match(actionSource, /registerUnit/);
  assert.match(clientSource, /aria-live="polite"/);
  assert.match(clientSource, /const \[isSaving, setIsSaving\]/);
});

test('broadcast tables do not render follow-up status controls', async () => {
  const pages = await Promise.all([
    readFile('src/app/(main)/pdf-broadcast/page.tsx', 'utf8'),
    readFile('src/app/(main)/xlsx-broadcast/page.tsx', 'utf8'),
  ]);

  for (const source of pages) {
    assert.doesNotMatch(source, /Status Follow-up/);
    assert.doesNotMatch(source, /followUpStatusOptions/);
    assert.doesNotMatch(source, /handleStatusChange/);
  }
});
