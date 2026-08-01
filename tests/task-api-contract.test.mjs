import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const routePath = new URL('../src/app/api/tasks/route.ts', import.meta.url);
const pagePath = new URL('../src/app/(main)/tasks/page.tsx', import.meta.url);

test('tasks API is protected and uses the board repository', async () => {
  const source = await readFile(routePath, 'utf8');

  assert.match(source, /requireSession/);
  assert.match(source, /GET/);
  assert.match(source, /PUT/);
  assert.match(source, /saveTaskBoard/);
  assert.match(source, /TaskBoardConflictError/);
  assert.match(source, /DATABASE_URL/);
});

test('tasks page reads and writes through the API instead of saving every change to localStorage', async () => {
  const source = await readFile(pagePath, 'utf8');

  assert.match(source, /fetch\(['"]\/api\/tasks/);
  assert.doesNotMatch(source, /localStorage\.setItem/);
});
