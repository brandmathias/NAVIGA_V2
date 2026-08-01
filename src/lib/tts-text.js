const NUMBER_WORDS = [
  'nol',
  'satu',
  'dua',
  'tiga',
  'empat',
  'lima',
  'enam',
  'tujuh',
  'delapan',
  'sembilan',
  'sepuluh',
  'sebelas',
];

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

function numberToWords(value) {
  const number = Math.trunc(Number(value));
  if (!Number.isFinite(number) || number < 0) return '';
  if (number < 12) return NUMBER_WORDS[number];
  if (number < 20) return `${numberToWords(number - 10)} belas`;
  if (number < 100) {
    const tens = Math.trunc(number / 10);
    const remainder = number % 10;
    return `${numberToWords(tens)} puluh${remainder ? ` ${numberToWords(remainder)}` : ''}`;
  }
  if (number < 200) return `seratus${number > 100 ? ` ${numberToWords(number - 100)}` : ''}`;
  if (number < 1000) {
    const hundreds = Math.trunc(number / 100);
    const remainder = number % 100;
    return `${numberToWords(hundreds)} ratus${remainder ? ` ${numberToWords(remainder)}` : ''}`;
  }
  if (number < 2000) return `seribu${number > 1000 ? ` ${numberToWords(number - 1000)}` : ''}`;
  if (number < 1_000_000) {
    const thousands = Math.trunc(number / 1000);
    const remainder = number % 1000;
    return `${numberToWords(thousands)} ribu${remainder ? ` ${numberToWords(remainder)}` : ''}`;
  }
  if (number < 1_000_000_000) {
    const millions = Math.trunc(number / 1_000_000);
    const remainder = number % 1_000_000;
    return `${numberToWords(millions)} juta${remainder ? ` ${numberToWords(remainder)}` : ''}`;
  }
  if (number < 1_000_000_000_000) {
    const billions = Math.trunc(number / 1_000_000_000);
    const remainder = number % 1_000_000_000;
    return `${numberToWords(billions)} miliar${remainder ? ` ${numberToWords(remainder)}` : ''}`;
  }
  const trillions = Math.trunc(number / 1_000_000_000_000);
  const remainder = number % 1_000_000_000_000;
  return `${numberToWords(trillions)} triliun${remainder ? ` ${numberToWords(remainder)}` : ''}`;
}

function parseAmount(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const raw = String(value ?? '').trim().replace(/[^0-9,.-]/g, '');
  if (!raw) return null;

  const lastComma = raw.lastIndexOf(',');
  const lastDot = raw.lastIndexOf('.');
  let normalized = raw;
  if (lastComma >= 0 && lastDot >= 0) {
    normalized = lastComma > lastDot
      ? raw.replace(/\./g, '').replace(',', '.')
      : raw.replace(/,/g, '');
  } else if (lastComma >= 0) {
    const decimals = raw.length - lastComma - 1;
    normalized = decimals === 3 ? raw.replace(/,/g, '') : raw.replace(',', '.');
  } else if (lastDot >= 0) {
    const decimals = raw.length - lastDot - 1;
    normalized = decimals === 3 ? raw.replace(/\./g, '') : raw;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatCurrencyForSpeech(value) {
  const amount = parseAmount(value);
  if (amount === null) return '';
  return `${numberToWords(Math.round(amount))} rupiah`;
}

function spellDigits(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits
    ? digits.split('').map((digit) => NUMBER_WORDS[Number(digit)]).join(' ')
    : '';
}

function firstLine(value) {
  return String(value ?? '').split(/\r?\n/)[0].trim();
}

function humanizeName(value) {
  const text = firstLine(value).replace(/\s+/g, ' ');
  if (!text || text !== text.toLocaleUpperCase('id-ID')) return text;
  return text
    .toLocaleLowerCase('id-ID')
    .replace(/(^|[\s,/'-])([a-zà-ÿ])/gi, (_, prefix, letter) => `${prefix}${letter.toLocaleUpperCase('id-ID')}`);
}

function parseDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const text = String(value ?? '').trim();
  const localDate = text.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (localDate) {
    const date = new Date(Number(localDate[3]), Number(localDate[2]) - 1, Number(localDate[1]));
    if (date.getFullYear() === Number(localDate[3])
      && date.getMonth() === Number(localDate[2]) - 1
      && date.getDate() === Number(localDate[1])) return date;
    return null;
  }
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateForSpeech(value) {
  const date = parseDate(value);
  if (!date) return '';
  return `${numberToWords(date.getDate())} ${MONTH_NAMES[date.getMonth()]} ${numberToWords(date.getFullYear())}`;
}

function formatUnitForSpeech(value) {
  const label = firstLine(value)
    .replace(/^Nasabah\s+/i, '')
    .replace(/\s*\/\s*/g, ', ');
  return normalizeSpeechText(humanizeName(label));
}

function normalizeSpeechText(value) {
  let text = String(value ?? '').normalize('NFC');
  text = text
    .replace(/<[^>]*>/g, ' ')
    .replace(/\bYth\.?\s*/gi, 'Yang terhormat ')
    .replace(/\bBpk\.?\s*\/\s*Ibu\b/gi, 'Bapak atau Ibu')
    .replace(/\bNo(?:\.|\b)\s*/gi, 'nomor ')
    .replace(/\b2\s*x\s*24\b/gi, 'dua kali dua puluh empat')
    .replace(/\be[\s-]?channel\b/gi, 'kanal elektronik')
    .replace(/\bN\/A\b/gi, ' ')
    .replace(/\bRp\.?\s*([0-9][0-9.,]*)/gi, (_, amount) => formatCurrencyForSpeech(amount))
    .replace(/(\d+(?:[.,]\d+)?)\s*%/g, '$1 persen')
    .replace(/\s*&\s*/g, ' dan ')
    .replace(/\s*\/\s*/g, ' atau ')
    .replace(/[()[\]*_`#]/g, ' ')
    .replace(/\s*-\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.!?])/g, '$1')
    .replace(/([,.!?])(?=\S)/g, '$1 ')
    .replace(/([,.!?])\1+/g, '$1')
    .trim();
  return text;
}

function withUnitIntro(unitName, body) {
  const unit = formatUnitForSpeech(unitName);
  return normalizeSpeechText(`${unit ? `Kami dari ${unit}. ` : ''}${body} Terima kasih.`);
}

function buildGadaiSpeechScript({ template, unitName, customerName, sbgNumber, collateral, dueDate }) {
  const name = humanizeName(customerName);
  const spokenNumber = spellDigits(sbgNumber);
  const spokenCollateral = normalizeSpeechText(humanizeName(collateral)) || 'barang jaminan Anda';
  const spokenDate = formatDateForSpeech(dueDate);
  const greeting = name ? `Bapak atau Ibu ${name}` : 'Bapak atau Ibu';
  const identity = `${greeting}, gadaian dengan nomor ${spokenNumber || 'yang tercatat'}, dengan jaminan ${spokenCollateral}`;
  const dueDatePhrase = spokenDate ? ` pada tanggal ${spokenDate}` : '';

  let body;
  switch (template) {
    case 'peringatan-lelang':
      body = `${identity} sudah lewat dari tanggal jatuh tempo${dueDatePhrase}, lebih dari empat belas hari yang lalu. Untuk menghindari proses lelang, silakan lakukan pelunasan atau perpanjangan di cabang terdekat dalam waktu dua kali dua puluh empat jam. Jika pembayaran sudah dilakukan, pesan ini dapat diabaikan.`;
      break;
    case 'keterlambatan':
      body = `${identity} sudah melewati tanggal jatuh tempo${dueDatePhrase}. Keterlambatan pembayaran dapat dikenai denda. Mohon segera melakukan pembayaran untuk menghindari denda yang lebih besar atau risiko lelang.`;
      break;
    case 'jatuh-tempo':
    default:
      body = `${identity} akan segera jatuh tempo${dueDatePhrase}. Silakan lakukan pembayaran bunga atau perpanjangan, atau cek fasilitas tambah pinjaman. Pembayaran dapat dilakukan melalui aplikasi Pegadaian Digital atau kanal elektronik lainnya.`;
      break;
  }

  return withUnitIntro(unitName, body);
}

function buildInstallmentSpeechScript({ template, unitName, customerName, productName, installmentAmount, obligationAmount, overdueDays }) {
  const name = humanizeName(customerName);
  const product = normalizeSpeechText(humanizeName(firstLine(productName).replace(/\s+-\s+-/g, ' '))) || 'angsuran Anda';
  const days = numberToWords(overdueDays) || 'nol';
  const installment = formatCurrencyForSpeech(installmentAmount);
  const obligation = formatCurrencyForSpeech(obligationAmount);
  const identity = name ? `Bapak atau Ibu ${name}` : 'Bapak atau Ibu';

  let body;
  switch (template) {
    case 'peringatan-lelang':
      body = `${identity}, angsuran untuk produk ${product} sudah melewati tanggal jatuh tempo selama lebih dari ${days} hari. Untuk menghindari pemutusan kontrak dan tindakan lebih lanjut, silakan lunasi seluruh kewajiban${obligation ? ` sebesar ${obligation}` : ''} dalam waktu dua kali dua puluh empat jam. Jika pembayaran sudah dilakukan, pesan ini dapat diabaikan.`;
      break;
    case 'keterlambatan':
      body = `${identity}, angsuran untuk produk ${product} sudah melewati tanggal jatuh tempo selama ${days} hari. Keterlambatan pembayaran dapat dikenai denda. Mohon segera melakukan pembayaran untuk menghindari denda yang lebih besar.`;
      break;
    case 'jatuh-tempo':
    default:
      body = `${identity}, angsuran untuk produk ${product}${installment ? ` sebesar ${installment}` : ''} akan segera jatuh tempo. Silakan lakukan pembayaran melalui aplikasi Pegadaian Digital atau kanal elektronik lainnya.`;
      break;
  }

  return withUnitIntro(unitName, body);
}

module.exports = {
  buildGadaiSpeechScript,
  buildInstallmentSpeechScript,
  formatCurrencyForSpeech,
  formatDateForSpeech,
  normalizeSpeechText,
  numberToWords,
  spellDigits,
};
