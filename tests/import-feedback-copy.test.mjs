import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const feedback = await import('../src/lib/import-feedback.mjs');

const unitContext = {
  domain: 'gadaian',
  source: 'pdf',
  session: { role: 'unit', unitName: 'UPC Wanea', unitPrefix: '11787' },
};

test('processing feedback names the extraction and active unit scope', () => {
  const result = feedback.getImportProcessingFeedback(unitContext);

  assert.equal(result.title, 'Menganalisis file gadaian');
  assert.match(result.description, /Mengekstrak data gadaian lengkap/);
  assert.match(result.description, /nomor SBG/);
  assert.match(result.description, /UPC Wanea/);
  assert.doesNotMatch(result.description, /Menyiapkan data\.?$/);
});

test('unit mismatch feedback explains that the file has no related unit data', () => {
  const result = feedback.getImportErrorFeedback(
    new Error('Tidak ada data gadai untuk unit aktif pada PDF ini.'),
    unitContext,
  );

  assert.equal(result.title, 'Data gadaian tidak ditemukan');
  assert.match(result.description, /tidak ditemukan data gadaian terkait unit ini/);
  assert.match(result.description, /prefix SBG 11787/);
  assert.match(result.description, /nomor SBG/);
});

test('extraction feedback explains which data structure needs checking', () => {
  const result = feedback.getImportErrorFeedback(
    new Error('Ekstraksi XLSX tidak menemukan data angsuran yang lengkap. Periksa format dokumen.'),
    { domain: 'angsuran', source: 'xlsx', session: { role: 'unit', unitName: 'UPC Wanea', unitPrefix: '11787' } },
  );

  assert.equal(result.title, 'Data angsuran belum terbaca');
  assert.match(result.description, /baris data angsuran lengkap/);
  assert.match(result.description, /kolom nomor kredit/);
});

test('unexpected parser errors stay user-safe and actionable', () => {
  const result = feedback.getImportErrorFeedback(
    new Error('Cannot read properties of undefined (reading SheetNames)'),
    { domain: 'angsuran', source: 'xlsx', session: { role: 'superadmin', unitName: null, unitPrefix: null } },
  );

  assert.equal(result.title, 'File belum dapat dianalisis');
  assert.match(result.description, /format XLSX atau foto tabel/);
  assert.doesNotMatch(result.description, /SheetNames|Cannot read/);
});

test('broadcast import pages use contextual feedback instead of generic parser copy', async () => {
  const [pdfPage, xlsxPage] = await Promise.all([
    readFile('src/app/(main)/pdf-broadcast/page.tsx', 'utf8'),
    readFile('src/app/(main)/xlsx-broadcast/page.tsx', 'utf8'),
  ]);

  for (const page of [pdfPage, xlsxPage]) {
    assert.match(page, /getImportProcessingFeedback/);
    assert.match(page, /getImportErrorFeedback/);
    assert.match(page, /getImportSuccessDescription/);
    assert.doesNotMatch(page, /description: 'Periksa file lalu coba lagi/);
    assert.doesNotMatch(page, /description: 'Menyiapkan data\.'/);
  }

  assert.match(xlsxPage, /if \(!customers\.length\)/);
  assert.match(xlsxPage, /Data angsuran hasil impor tidak memuat nomor WhatsApp/);
});
