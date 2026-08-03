import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const migrationPath = new URL('../db/migrations/003_create_naviga_broadcast_history.sql', import.meta.url);
const repositoryPath = new URL('../src/lib/broadcast-history-repository.ts', import.meta.url);
const routePath = new URL('../src/app/api/broadcast-history/route.ts', import.meta.url);
const clientPath = new URL('../src/lib/broadcast-history-client.mjs', import.meta.url);
const legacyPath = new URL('../src/lib/broadcast-history-legacy.mjs', import.meta.url);
const pdfPagePath = new URL('../src/app/(main)/pdf-broadcast/page.tsx', import.meta.url);
const xlsxPagePath = new URL('../src/app/(main)/xlsx-broadcast/page.tsx', import.meta.url);
const historyPagePath = new URL('../src/app/(main)/history/page.tsx', import.meta.url);

async function readOrEmpty(path) {
  try {
    return await readFile(path, 'utf8');
  } catch {
    return '';
  }
}

test('broadcast history stores only auditable metadata in PostgreSQL', async () => {
  const [migration, repository] = await Promise.all([
    readOrEmpty(migrationPath),
    readOrEmpty(repositoryPath),
  ]);
  const source = `${migration}\n${repository}`;

  assert.match(source, /naviga_broadcast_history/);
  assert.match(source, /scope_key\s+TEXT/);
  assert.match(source, /created_by_user_id\s+TEXT/);
  assert.match(source, /customer_name\s+TEXT/);
  assert.match(source, /customer_identifier\s+TEXT/);
  assert.match(source, /created_at\s+TIMESTAMPTZ/);
  assert.doesNotMatch(source, /phone_number|message_text|message_body|audio_data|whatsapp_url/i);
});

test('broadcast history API derives access scope from the authenticated session', async () => {
  const [route, repository] = await Promise.all([
    readOrEmpty(routePath),
    readOrEmpty(repositoryPath),
  ]);

  assert.match(route, /requireSession/);
  assert.match(route, /GET/);
  assert.match(route, /POST/);
  assert.match(route, /DELETE/);
  assert.match(route, /session/);
  assert.match(route, /Cache-Control/);
  assert.match(repository, /scopeForSession|session\.role/);
  assert.match(repository, /created_by_user_id/);
});

test('broadcast pages send metadata to the protected history API without persisting broadcast payloads', async () => {
  const [client, legacy, pdfPage, xlsxPage] = await Promise.all([
    readOrEmpty(clientPath),
    readOrEmpty(legacyPath),
    readOrEmpty(pdfPagePath),
    readOrEmpty(xlsxPagePath),
  ]);

  assert.match(client, /\/api\/broadcast-history/);
  assert.match(client, /createBroadcastHistoryEntry/);
  assert.match(client, /migrateLegacyBroadcastHistory/);
  assert.match(legacy, /broadcastHistory_/);
  assert.match(pdfPage, /createBroadcastHistoryEntry/);
  assert.match(xlsxPage, /createBroadcastHistoryEntry/);
  assert.doesNotMatch(client, /audioDataUri|whatsappUrl|phoneNumber|message/);
  assert.doesNotMatch(pdfPage, /localStorage\.(getItem|setItem|removeItem)/);
  assert.doesNotMatch(xlsxPage, /localStorage\.(getItem|setItem|removeItem)/);
});

test('history page loads and clears entries through the database API', async () => {
  const source = await readOrEmpty(historyPagePath);

  assert.match(source, /getBroadcastHistory/);
  assert.match(source, /clearBroadcastHistory/);
  assert.match(source, /migrateLegacyBroadcastHistory/);
  assert.match(source, /\/api\/broadcast-history|broadcast-history-client/);
  assert.doesNotMatch(source, /localStorage\.(getItem|setItem|removeItem)/);
});
