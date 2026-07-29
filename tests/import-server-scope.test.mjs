import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('PDF and XLSX imports enforce registered unit prefixes on the server', async () => {
  const [pdfAction, xlsxAction] = await Promise.all([
    readFile('src/app/(main)/pdf-broadcast/actions.ts', 'utf8'),
    readFile('src/app/(main)/xlsx-broadcast/actions.ts', 'utf8'),
  ]);

  for (const source of [pdfAction, xlsxAction]) {
    assert.match(source, /requireSession\(\)/);
    assert.match(source, /listUnits\(\)/);
  }

  assert.match(pdfAction, /filterGadaiCustomersByPrefix/);
  assert.match(xlsxAction, /filterInstallmentCustomersByPrefix/);
});

test('XLSX screen delegates file parsing to its server action', async () => {
  const source = await readFile('src/app/(main)/xlsx-broadcast/page.tsx', 'utf8');

  assert.match(source, /parseXlsx/);
  assert.doesNotMatch(source, /import \* as XLSX from 'xlsx'/);
  assert.doesNotMatch(source, /parseInstallmentRows/);
});
