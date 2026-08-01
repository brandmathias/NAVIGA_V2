import test from 'node:test';
import assert from 'node:assert/strict';
async function loadParser() {
  const module = await import('../src/lib/gadai-ocr-parser.js').catch(() => ({}));
  return module.default ?? module;
}

function layoutLine(values) {
  const line = Array(224).fill(' ');
  for (const [column, value] of values) {
    String(value).split('').forEach((character, index) => {
      line[column + index] = character;
    });
  }
  return line.join('').trimEnd();
}

test('parses the native layout text used by Pegadaian maturity reports', async () => {
  const { parseGadaiOcrOutput } = await loadParser();
  const layout = [
    'DAFTAR KREDIT JATUH TEMPO',
    'No.          No. SBG             Rubrik             Nasabah                  Telp/HP.            Tgl Kredit                        Barang Jaminan                           Taksiran         Uang Pinjaman          SM',
    layoutLine([
      [1, '1'], [5, '1178726010000001'], [32, 'B1  - KT'], [43, 'SITI AMINAH'],
      [71, '081234567890'], [96, '01-04-2026'], [113, 'SATU CINCIN EMAS'],
      [178, '2,000,000'], [198, '1,500,000'], [215, '120,000'],
    ]),
    layoutLine([[43, 'MAHARANI'], [113, '16 KARAT BERAT 2 GRAM']]),
    layoutLine([[6, '-'], [43, 'JALAN WANEA SATU'], [96, '01-08-2026']]),
  ].join('\n');

  assert.deepEqual(parseGadaiOcrOutput(layout), [
    {
      sbg_number: '1178726010000001',
      rubrik: 'B1 - KT',
      name: 'SITI AMINAH MAHARANI',
      phone_number: '081234567890',
      credit_date: '01-04-2026',
      due_date: '01-08-2026',
      loan_value: 1500000,
      barang_jaminan: 'SATU CINCIN EMAS 16 KARAT BERAT 2 GRAM',
      taksiran: 2000000,
      sewa_modal: 120000,
      alamat: 'JALAN WANEA SATU',
      status: '',
    },
  ]);
});

test('preserves customer columns when a report page shifts one character left', async () => {
  const { parseGadaiOcrOutput } = await loadParser();
  const layout = [
    layoutLine([
      [0, 'No.'], [12, 'No. SBG'], [32, 'Rubrik'], [51, 'Nasabah'],
      [76, 'Telp/HP.'], [96, 'Tgl Kredit'], [130, 'Barang Jaminan'],
      [171, 'Taksiran'], [188, 'Uang Pinjaman'], [211, 'SM'],
    ]),
    layoutLine([
      [0, '1'], [4, '1178726010000002'], [31, 'D  -  KT'], [42, 'BUDI SANTOSO'],
      [70, '082212345678'], [95, '02-04-2026'], [112, 'SATU GELANG EMAS'],
      [177, '3,000,000'], [197, '2,500,000'], [214, '200,000'],
    ]),
    layoutLine([[5, '-'], [42, 'GIRIAN WERU DUA'], [95, '02-08-2026']]),
  ].join('\n');

  const [customer] = parseGadaiOcrOutput(layout);
  assert.equal(customer.name, 'BUDI SANTOSO');
  assert.equal(customer.alamat, 'GIRIAN WERU DUA');
  assert.equal(customer.barang_jaminan, 'SATU GELANG EMAS');
});

test('parses a local PDF Markdown table into broadcast-ready gadai records', async () => {
  const { parseGadaiOcrOutput } = await loadParser();
  assert.equal(typeof parseGadaiOcrOutput, 'function');
  const markdown = `
| No. SBG | Rubrik | Nama Nasabah | No. HP | Tgl Kredit | Jatuh Tempo | UP | Barang Jaminan | Taksiran | SM | Alamat | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 117870123456 | A - KT | Siti Aminah | 0812-3456-7890 | 01/06/2026 | 01/09/2026 | Rp 1.500.000 | Cincin emas | Rp 2.000.000 | Rp 15.000 | Jl. Wanea 1 | Aktif |
`;

  assert.deepEqual(parseGadaiOcrOutput(markdown), [
    {
      sbg_number: '117870123456',
      rubrik: 'A - KT',
      name: 'Siti Aminah',
      phone_number: '0812-3456-7890',
      credit_date: '01/06/2026',
      due_date: '01/09/2026',
      loan_value: 1500000,
      barang_jaminan: 'Cincin emas',
      taksiran: 2000000,
      sewa_modal: 15000,
      alamat: 'Jl. Wanea 1',
      status: 'Aktif',
    },
  ]);
});

test('parses repeated key-value records and excludes incomplete OCR rows', async () => {
  const { parseGadaiOcrOutput } = await loadParser();
  assert.equal(typeof parseGadaiOcrOutput, 'function');
  const markdown = `
No. SBG: 117930222222
Nama Nasabah: Budi
No. HP: 0822 1000 2000
Tgl Kredit: 02/06/2026
Jatuh Tempo: 02/09/2026
UP: 750.000
Barang Jaminan: Laptop
Taksiran: 1.000.000
SM: 7.500
Alamat: Ranotana
Status: Aktif

No. SBG: 117930333333
Nama Nasabah: Data Tanpa Tanggal
`;

  assert.deepEqual(parseGadaiOcrOutput(markdown), [
    {
      sbg_number: '117930222222',
      rubrik: '',
      name: 'Budi',
      phone_number: '0822 1000 2000',
      credit_date: '02/06/2026',
      due_date: '02/09/2026',
      loan_value: 750000,
      barang_jaminan: 'Laptop',
      taksiran: 1000000,
      sewa_modal: 7500,
      alamat: 'Ranotana',
      status: 'Aktif',
    },
  ]);
});

test('returns no records for OCR text without a complete customer identity', async () => {
  const { parseGadaiOcrOutput } = await loadParser();
  assert.equal(typeof parseGadaiOcrOutput, 'function');
  assert.deepEqual(parseGadaiOcrOutput('Dokumen tidak terbaca.'), []);
});

test('limits gadai records by any registered five-digit SBG prefix', async () => {
  const { filterGadaiCustomersByPrefix } = await loadParser();
  assert.equal(typeof filterGadaiCustomersByPrefix, 'function');

  const customers = [
    { sbg_number: '117990000001', name: 'Garuda' },
    { sbg_number: '117870000001', name: 'Wanea' },
  ];

  assert.deepEqual(
    filterGadaiCustomersByPrefix(customers, '11799').map((customer) => customer.name),
    ['Garuda'],
  );
});

test('parses RapidDoc HTML tables from a photographed gadai report', async () => {
  const { parseGadaiOcrOutput } = await loadParser();
  const html = `
<table>
  <tr><td>No.</td><td>No. SBG</td><td>Rubrik</td><td>Nasabah</td><td>Telp/HP.</td><td>Tgl Kredit Tgl Jatuh Tempo</td><td>Barang Jaminan</td><td>Taksiran</td><td>Uang Pinjaman</td><td>SM</td></tr>
  <tr><td>1</td><td>1178725010004741</td><td>A - KT</td><td>ESRYANTI MASAMBE</td><td></td><td>08-04-2025</td><td>SATU CINCIN UKIR RUSAK DITAKSIR</td><td>534,148</td><td>490,000</td><td>39,200</td></tr>
  <tr><td>-</td><td></td><td></td><td>LINGKUNGAN I RT/RW: 000/01 KodePOS 95246</td><td>081218539816</td><td>05-08-2025</td><td>PERHIASAN EMAS 16 KARAT BERAT 0.53/0.53 GRAM</td><td></td><td></td><td></td></tr>
</table>`;

  assert.deepEqual(parseGadaiOcrOutput(html), [
    {
      sbg_number: '1178725010004741',
      rubrik: 'A - KT',
      name: 'ESRYANTI MASAMBE',
      phone_number: '081218539816',
      credit_date: '08-04-2025',
      due_date: '05-08-2025',
      loan_value: 490000,
      barang_jaminan: 'SATU CINCIN UKIR RUSAK DITAKSIR PERHIASAN EMAS 16 KARAT BERAT 0.53/0.53 GRAM',
      taksiran: 534148,
      sewa_modal: 39200,
      alamat: 'LINGKUNGAN I RT/RW: 000/01 KodePOS 95246',
      status: '',
    },
  ]);
});

test('keeps the primary phone and treats a city line as the customer address', async () => {
  const { parseGadaiOcrOutput } = await loadParser();
  const html = `
<table>
  <tr><td>No.</td><td>No. SBG</td><td>Rubrik</td><td>Nasabah</td><td>Telp/HP.</td><td>Tgl Kredit Tgl Jatuh Tempo</td></tr>
  <tr><td>1</td><td>1178724010022779</td><td>B1 - KT</td><td>SILVIA GANHA</td><td>081341391598</td><td>08-04-2025</td></tr>
  <tr><td></td><td></td><td></td><td>TANJUNG BATU</td><td>081355703575</td><td>05-08-2025</td></tr>
</table>`;

  const [customer] = parseGadaiOcrOutput(html);
  assert.equal(customer.name, 'SILVIA GANHA');
  assert.equal(customer.phone_number, '081341391598');
  assert.equal(customer.alamat, 'TANJUNG BATU');
});
