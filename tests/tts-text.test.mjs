import assert from 'node:assert/strict';
import test from 'node:test';

const speechModule = await import('../src/lib/tts-text.js');
const speech = speechModule.default ?? speechModule;

test('gadai speech script uses natural Indonesian phrasing', () => {
  const result = speech.buildGadaiSpeechScript({
    template: 'peringatan-lelang',
    unitName: 'Pegadaian Wanea / Tanjung Batu',
    customerName: 'BUDI SANTOSO',
    sbgNumber: '117870012345',
    collateral: 'EMAS / PERHIASAN',
    dueDate: '02/08/2026',
  });

  assert.match(result, /Bapak atau Ibu Budi Santoso/);
  assert.match(result, /dua kali dua puluh empat jam/);
  assert.match(result, /dua Agustus dua ribu dua puluh enam/);
  assert.match(result, /dengan jaminan Emas atau Perhiasan/);
  assert.doesNotMatch(result, /[*_`()\[\]\/]/);
  assert.doesNotMatch(result, /Yth|Bpk|TANGGAL TIDAK VALID|Nasabah/);
});

test('installment speech script separates the customer name from the account identifier', () => {
  const result = speech.buildInstallmentSpeechScript({
    template: 'jatuh-tempo',
    unitName: 'Nasabah PEGADAIAN RANOTANA / RANOTANA',
    customerName: 'SITI AMINAH\n117930000123',
    productName: 'KREASI\n- -',
    installmentAmount: 15000,
    overdueDays: 0,
  });

  assert.match(result, /Bapak atau Ibu Siti Aminah/);
  assert.doesNotMatch(result, /117930000123/);
  assert.match(result, /produk Kreasi/);
  assert.match(result, /lima belas ribu rupiah/);
  assert.doesNotMatch(result, /[*_`()\[\]\/]/);
});

test('speech formatter expands common shorthand without leaving technical placeholders', () => {
  const result = speech.normalizeSpeechText('Yth. Bpk/Ibu, No. 12, Rp15.000, 2x24 jam, e-channel, *penting*');

  assert.match(result, /Yang terhormat Bapak atau Ibu/);
  assert.match(result, /nomor 12/);
  assert.match(result, /lima belas ribu rupiah/);
  assert.match(result, /dua kali dua puluh empat jam/);
  assert.match(result, /kanal elektronik/);
  assert.doesNotMatch(result, /[*_`()\[\]\/]/);
});
