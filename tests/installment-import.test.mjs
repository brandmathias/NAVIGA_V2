import test from 'node:test';
import assert from 'node:assert/strict';
import importer from '../src/lib/installment-import.js';

const { parseInstallmentRows, filterInstallmentCustomersByPrefix } = importer;

test('parseInstallmentRows skips headers and blank rows while parsing Indonesian amounts', () => {
  const customers = parseInstallmentRows([
    ['NASABAH', 'PRODUK', 'PINJAMAN', 'OSL', 'KOL', 'HR TUNG', 'TENOR', 'ANGSURAN', 'KEWAJIBAN', 'PENCAIRAN', 'NO. KREDIT'],
    ['Siti\n123', 'KCA', 'Rp 1.234.567,50', '1.000,25', '2', '15', '12 bulan', 'Rp 100.000', '50.000,75', 'UPC Wanea', '117870000123'],
    ['', '', '', '', '', '', '', '', '', ''],
  ]);

  assert.deepEqual(customers, [
    {
      id: 'row-1',
      nasabah: 'Siti\n123',
      produk: 'KCA',
      pinjaman: 1234567.5,
      osl: 1000.25,
      kol: 2,
      hr_tung: 15,
      tenor: '12 bulan',
      angsuran: 100000,
      kewajiban: 50000.75,
      pencairan: 'UPC Wanea',
      account_number: '117870000123',
      kunjungan_terakhir: 'N/A',
      phone_number: '',
      follow_up_status: 'dihubungi',
    },
  ]);
});

test('filters installment rows by the first five digits of their identifier', () => {
  const rows = [
    ['NASABAH', 'PRODUK', 'PINJAMAN', 'OSL', 'KOL', 'HR TUNG', 'TENOR', 'ANGSURAN', 'KEWAJIBAN', 'PENCAIRAN', 'NO. KONTRAK'],
    ['Wanea', 'KCA', 1, 2, 3, 4, 'x', 5, 6, 'Bukan Penentu', '117870000001'],
    ['Garuda', 'KCA', 1, 2, 3, 4, 'x', 5, 6, 'Bukan Penentu', '117990000001'],
  ];
  const customers = parseInstallmentRows(rows);

  assert.deepEqual(
    filterInstallmentCustomersByPrefix(customers, '11787').map(customer => customer.nasabah),
    ['Wanea'],
  );
  assert.deepEqual(
    filterInstallmentCustomersByPrefix(customers, '11799').map(customer => customer.nasabah),
    ['Garuda'],
  );
});
