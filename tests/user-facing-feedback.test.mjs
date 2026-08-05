import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { getUserFacingMessage } from '../src/lib/user-facing-message.mjs';

const feedbackPaths = [
  'src/app/login/page.tsx',
  'src/app/(main)/pdf-broadcast/page.tsx',
  'src/app/(main)/xlsx-broadcast/page.tsx',
  'src/app/(main)/profile/page.tsx',
  'src/app/(main)/history/page.tsx',
  'src/app/(main)/tasks/page.tsx',
  'src/app/(main)/unit-management/new/unit-create-client.tsx',
  'src/app/(main)/unit-management/unit-management-client.tsx',
  'src/components/AddTaskDialog.tsx',
  'src/components/TaskDetailsDialog.tsx',
];

test('technical failure details are replaced with clear next steps', () => {
  const fallback = 'File belum dapat digunakan. Periksa data lalu coba lagi.';
  const technicalMessages = [
    'OCR service tidak tersedia.',
    'Piper gagal membuat audio.',
    'PostgreSQL connection refused.',
    'DATABASE_URL belum dikonfigurasi.',
    'Cannot read properties of undefined (reading SheetNames)',
  ];

  for (const message of technicalMessages) {
    assert.equal(getUserFacingMessage(message, fallback), fallback);
  }
});

test('user-safe messages remain specific instead of being hidden behind a generic fallback', () => {
  const message = 'Tidak ada data gadaian untuk unit aktif pada file ini.';
  assert.equal(getUserFacingMessage(message, 'File belum dapat digunakan.'), message);
});

test('all user-facing error surfaces use the shared message guard', async () => {
  const sources = await Promise.all(feedbackPaths.map((path) => readFile(path, 'utf8')));

  for (const source of sources) {
    assert.match(source, /getUserFacingMessage/);
  }
});
