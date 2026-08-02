import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const routePath = new URL('../src/app/api/tasks/route.ts', import.meta.url);
const pagePath = new URL('../src/app/(main)/tasks/page.tsx', import.meta.url);
const repositoryPath = new URL('../src/lib/task-board-repository.ts', import.meta.url);
const sessionPath = new URL('../src/lib/auth-session.ts', import.meta.url);

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

test('tasks board scope isolates superadmin accounts but shares a unit board', async () => {
  const [repositorySource, sessionSource] = await Promise.all([
    readFile(repositoryPath, 'utf8'),
    readFile(sessionPath, 'utf8'),
  ]);

  assert.match(sessionSource, /userId: string/);
  assert.match(sessionSource, /userId: String\(user\.id\)/);
  assert.match(repositorySource, /superadmin:\$\{session\.userId\}/);
  assert.match(repositorySource, /unit:\$\{session\.unitId \?\? session\.unitPrefix \?\? session\.upc\}/);
  assert.doesNotMatch(repositorySource, /global:superadmin/);
});

test('new tasks persist creator identity for the kanban card avatar', async () => {
  const source = await readFile(pagePath, 'utf8');

  assert.match(source, /createdByUserId: userId/);
  assert.match(source, /createdByName: userName/);
  assert.match(source, /taskBoardData_\$\{userId\}/);
});
