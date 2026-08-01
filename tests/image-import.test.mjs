import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('converts a photographed Angsuran table into the existing import shape', async () => {
  const ocrParser = await import('../src/lib/installment-ocr-parser.js');
  const { parseInstallmentOcrOutput } = ocrParser.default ?? ocrParser;

  const customers = parseInstallmentOcrOutput(`
| Nasabah | Produk | Pinjaman | OSL | KOL | HR TUNG | Tenor | Angsuran | Kewajiban | Pencairan | No. Kredit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Siti Aminah | KCA | Rp 1.500.000 | Rp 1.000.000 | 2 | 15 | 12 bulan | Rp 125.000 | Rp 250.000 | UPC Wanea | 117870000123 |
`);

  assert.equal(customers.length, 1);
  assert.equal(customers[0].nasabah, 'Siti Aminah');
  assert.equal(customers[0].account_number, '117870000123');
  assert.equal(customers[0].kewajiban, 250000);
});

test('both broadcast imports use one file picker for document and photo OCR', async () => {
  const [gadaiAction, angsuranAction, gadaiPage, angsuranPage] = await Promise.all([
    readFile('src/app/(main)/pdf-broadcast/actions.ts', 'utf8'),
    readFile('src/app/(main)/xlsx-broadcast/actions.ts', 'utf8'),
    readFile('src/app/(main)/pdf-broadcast/page.tsx', 'utf8'),
    readFile('src/app/(main)/xlsx-broadcast/page.tsx', 'utf8'),
  ]);

  assert.match(gadaiAction, /export async function parseGadaiImage/);
  assert.match(gadaiAction, /extractGadaiImageMarkdown/);
  assert.match(gadaiAction, /filterGadaiCustomersByPrefix/);
  assert.match(angsuranAction, /export async function parseInstallmentImage/);
  assert.match(angsuranAction, /extractInstallmentImageMarkdown/);
  assert.match(angsuranAction, /filterInstallmentCustomersByPrefix/);

  assert.match(gadaiPage, /accept="\.pdf,image\/jpeg,image\/png,image\/webp"/);
  assert.match(angsuranPage, /accept="\.xlsx,image\/jpeg,image\/png,image\/webp"/);

  for (const page of [gadaiPage, angsuranPage]) {
    assert.match(page, /Import File/);
    assert.doesNotMatch(page, /Impor Foto/);
    assert.equal((page.match(/type="file"/g) ?? []).length, 1);
  }
});
