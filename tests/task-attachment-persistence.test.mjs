import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const migrationPath = new URL('../db/migrations/002_create_naviga_task_attachments.sql', import.meta.url);
const repositoryPath = new URL('../src/lib/task-attachment-repository.ts', import.meta.url);
const clientPath = new URL('../src/lib/task-attachments.mjs', import.meta.url);
const uploadRoutePath = new URL('../src/app/api/tasks/attachments/route.ts', import.meta.url);
const itemRoutePath = new URL('../src/app/api/tasks/attachments/[attachmentId]/route.ts', import.meta.url);

async function readOrEmpty(path) {
  try {
    return await readFile(path, 'utf8');
  } catch {
    return '';
  }
}

test('task attachments have a PostgreSQL byte store scoped to the authenticated board', async () => {
  const [migration, repository] = await Promise.all([readOrEmpty(migrationPath), readOrEmpty(repositoryPath)]);

  assert.match(migration, /naviga_task_attachments/);
  assert.match(migration, /content_bytes\s+BYTEA/);
  assert.match(migration, /scope_key\s+TEXT/);
  assert.match(repository, /getPostgresPool/);
  assert.match(repository, /scope_key/);
  assert.match(repository, /content_bytes/);
  assert.match(repository, /Buffer/);
});

test('attachment API uploads, serves, and deletes only within the signed session scope', async () => {
  const [uploadRoute, itemRoute] = await Promise.all([readOrEmpty(uploadRoutePath), readOrEmpty(itemRoutePath)]);

  assert.match(uploadRoute, /requireSession/);
  assert.match(uploadRoute, /scopeForSession/);
  assert.match(uploadRoute, /formData\(\)/);
  assert.match(uploadRoute, /saveTaskAttachment/);
  assert.match(itemRoute, /requireSession/);
  assert.match(itemRoute, /scopeForSession/);
  assert.match(itemRoute, /getTaskAttachment/);
  assert.match(itemRoute, /deleteTaskAttachment/);
});

test('browser attachment helper uses the protected API instead of IndexedDB', async () => {
  const source = await readOrEmpty(clientPath);

  assert.match(source, /\/api\/tasks\/attachments/);
  assert.match(source, /FormData/);
  assert.match(source, /fetch/);
  assert.doesNotMatch(source, /indexedDB/);
  assert.doesNotMatch(source, /naviga-task-attachments/);
});
