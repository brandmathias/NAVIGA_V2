import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import gadaiParser from '../src/lib/gadai-ocr-parser.js';
import installmentImporter from '../src/lib/installment-import.js';
import whatsappRecipient from '../src/lib/whatsapp-recipient.js';
import piper from '../src/lib/piper-tts.js';

const { parseGadaiOcrOutput } = gadaiParser;
const { parseInstallmentRows } = installmentImporter;
const { normalizeIndonesianWhatsAppNumber } = whatsappRecipient;
const { synthesizePiperWav } = piper;

const WAV_HEADER = Uint8Array.from([
  82, 73, 70, 70, 0, 0, 0, 0, 87, 65, 86, 69,
]);

test('normalizes Indonesian mobile numbers before constructing a WhatsApp URL', () => {
  assert.equal(normalizeIndonesianWhatsAppNumber('0812-3456-7890'), '6281234567890');
  assert.equal(normalizeIndonesianWhatsAppNumber('+62 822 1000 2000'), '6282210002000');
  assert.equal(normalizeIndonesianWhatsAppNumber('620000000000'), null);
  assert.equal(normalizeIndonesianWhatsAppNumber('not-a-number'), null);
});

test('does not extract PDF rows that lack a valid WhatsApp number', () => {
  const customers = parseGadaiOcrOutput(`
| No SBG | Nama | Jatuh Tempo | No HP |
| --- | --- | --- | --- |
| 117870123456 | Siti Aminah | 01/09/2026 | - |
`);

  assert.deepEqual(customers, []);
});

test('imports an XLSX phone column instead of using a placeholder recipient', () => {
  const customers = parseInstallmentRows([
    ['Nasabah', 'Produk', 'Pinjaman', 'OSL', 'KOL', 'HR TUNG', 'Tenor', 'Angsuran', 'Kewajiban', 'Pencairan', 'Kunjungan Terakhir', 'No HP'],
    ['Budi', 'KREASI', '1000000', '800000', '1', '3', '12', '100000', '850000', 'Pegadaian Wanea', '2026-07-01', '0812 3456 7890'],
  ], 'Pegadaian Wanea');

  assert.equal(customers.length, 1);
  assert.equal(customers[0].phone_number, '0812 3456 7890');
});

test('rejects a Piper endpoint that is not bound to localhost', async () => {
  await assert.rejects(
    synthesizePiperWav('Selamat pagi', {
      baseUrl: 'https://example.invalid',
      fetchImpl: async () => new Response(WAV_HEADER, { status: 200 }),
    }),
    /PIPER_BASE_URL hanya boleh menunjuk ke service lokal/i,
  );
});

test('broadcast screens never report WhatsApp delivery merely by opening its tab', async () => {
  const pdfSource = await readFile(new URL('../src/app/(main)/pdf-broadcast/page.tsx', import.meta.url), 'utf8');
  const xlsxSource = await readFile(new URL('../src/app/(main)/xlsx-broadcast/page.tsx', import.meta.url), 'utf8');

  assert.doesNotMatch(pdfSource, /Notifikasi Terkirim/);
  assert.match(pdfSource, /WhatsApp Dibuka/);
  assert.doesNotMatch(xlsxSource, /Notifikasi Terkirim/);
  assert.doesNotMatch(xlsxSource, /wa\.me/);
  assert.doesNotMatch(xlsxSource, /620000000000/);
  assert.match(xlsxSource, /generateCustomerVoicenote/);
});
