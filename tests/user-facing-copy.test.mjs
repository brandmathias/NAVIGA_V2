import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const pagePaths = [
  '../src/app/login/page.tsx',
  '../src/app/(main)/pdf-broadcast/page.tsx',
  '../src/app/(main)/xlsx-broadcast/page.tsx',
];

const pageSources = await Promise.all(pagePaths.map((path) => readFile(new URL(path, import.meta.url), 'utf8')));

test('user-facing status messages avoid implementation-specific service names', () => {
  for (const source of pageSources) {
    assert.doesNotMatch(source, /PostgreSQL|DATABASE_URL|OCR membaca|hasil OCR|Piper sedang|Piper secara lokal|Server autentikasi/);
  }
});
