const FIELD_ALIASES = {
  sbg_number: ['sbg', 'nosbg', 'nomorsbg', 'sbgnumber', 'suratbuktigadai'],
  rubrik: ['rubrik', 'koderubrik'],
  name: ['nama', 'namanasabah', 'nasabah'],
  phone_number: ['nohp', 'nomorhp', 'notelepon', 'nomortelepon', 'notelp', 'telp', 'telphp', 'telepon', 'phone', 'phonenumber'],
  credit_date: ['tglkredit', 'tanggalkredit', 'creditdate'],
  due_date: ['jatuhtempo', 'tgljatuhtempo', 'tanggaljatuhtempo', 'duedate'],
  loan_value: ['up', 'uangpinjaman', 'nilaipinjaman', 'loanvalue', 'pinjaman'],
  barang_jaminan: ['barangjaminan', 'jaminan', 'barang'],
  taksiran: ['taksiran', 'nilaitaksiran'],
  sewa_modal: ['sm', 'sewamodal'],
  alamat: ['alamat'],
  status: ['status'],
};
const { normalizeIndonesianWhatsAppNumber } = require('./whatsapp-recipient');

const aliasToField = new Map(
  Object.entries(FIELD_ALIASES).flatMap(([field, aliases]) =>
    aliases.map((alias) => [alias, field])
  )
);

function normalizeHeader(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function getField(header) {
  const normalized = normalizeHeader(header);
  if (normalized.includes('nosbg')) return 'sbg_number';
  if (normalized.includes('tglkredit') && normalized.includes('jatuhtempo')) return 'report_dates';
  return aliasToField.get(normalized);
}

function cleanText(value) {
  return String(value ?? '')
    .replace(/<br\s*\/?\s*>/gi, ' ')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseAmount(value) {
  let numeric = cleanText(value).replace(/[^0-9,.-]/g, '');
  if (!numeric) return 0;

  const commas = (numeric.match(/,/g) || []).length;
  const dots = (numeric.match(/\./g) || []).length;
  const lastComma = numeric.lastIndexOf(',');
  const lastDot = numeric.lastIndexOf('.');

  if (commas && dots) {
    if (lastComma > lastDot) {
      numeric = numeric.replace(/\./g, '').replace(',', '.');
    } else {
      numeric = numeric.replace(/,/g, '');
    }
  } else if (commas) {
    const decimalPart = numeric.slice(lastComma + 1);
    numeric = commas === 1 && decimalPart.length <= 2
      ? numeric.replace(',', '.')
      : numeric.replace(/,/g, '');
  } else if (dots) {
    const decimalPart = numeric.slice(lastDot + 1);
    numeric = dots === 1 && decimalPart.length <= 2
      ? numeric
      : numeric.replace(/\./g, '');
  }

  const parsed = Number(numeric);
  return Number.isFinite(parsed) ? parsed : 0;
}

function splitMarkdownRow(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith('|')) return [];
  const content = trimmed.endsWith('|') ? trimmed.slice(1, -1) : trimmed.slice(1);
  return content.split('|').map(cleanText);
}

function isSeparatorRow(cells) {
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell.replace(/\s/g, '')));
}

function toCustomer(values) {
  return {
    sbg_number: cleanText(values.sbg_number).replace(/\s+/g, ''),
    rubrik: cleanText(values.rubrik),
    name: cleanText(values.name),
    phone_number: cleanText(values.phone_number),
    credit_date: cleanText(values.credit_date),
    due_date: cleanText(values.due_date),
    loan_value: parseAmount(values.loan_value),
    barang_jaminan: cleanText(values.barang_jaminan),
    taksiran: parseAmount(values.taksiran),
    sewa_modal: parseAmount(values.sewa_modal),
    alamat: cleanText(values.alamat),
    status: cleanText(values.status),
  };
}

function isCompleteCustomer(customer) {
  return Boolean(
    customer.sbg_number
    && customer.name
    && customer.due_date
    && normalizeIndonesianWhatsAppNumber(customer.phone_number),
  );
}

function parseMarkdownTables(markdown) {
  const lines = markdown.split(/\r?\n/);
  const customers = [];

  for (let index = 0; index < lines.length - 1; index += 1) {
    const headers = splitMarkdownRow(lines[index]);
    const separator = splitMarkdownRow(lines[index + 1]);
    if (!headers.length || headers.length !== separator.length || !isSeparatorRow(separator)) continue;

    const fields = headers.map(getField);
    if (!fields.includes('sbg_number')) continue;

    for (let rowIndex = index + 2; rowIndex < lines.length; rowIndex += 1) {
      const cells = splitMarkdownRow(lines[rowIndex]);
      if (!cells.length || cells.length !== headers.length) break;

      const values = {};
      fields.forEach((field, cellIndex) => {
        if (field) values[field] = cells[cellIndex];
      });
      const customer = toCustomer(values);
      if (isCompleteCustomer(customer)) customers.push(customer);
    }
  }

  return customers;
}

function cleanHtmlCell(value) {
  return cleanText(
    String(value ?? '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
  );
}

function parseHtmlRows(table) {
  return [...table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map((row) =>
    [...row[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) => cleanHtmlCell(cell[1]))
  ).filter((row) => row.length > 0);
}

function looksLikeAddress(value) {
  return /\b(?:lingkungan|rt\s*\/\s*rw|kode\s*pos|jalan|jaga|kelurahan|tanjung|ranoiapo)\b/i.test(value);
}

function collectDates(value) {
  return String(value ?? '').match(/\b\d{2}[-/]\d{2}[-/]\d{4}\b/g) ?? [];
}

function collectPhones(value) {
  const compactNumbers = String(value ?? '').match(/(?:\+?62|0)8\d{7,11}/g) ?? [];
  if (compactNumbers.length) return compactNumbers;
  return String(value ?? '').match(/(?:\+?62|0)8(?:[\s.-]?\d){7,11}/g) ?? [];
}

function parseHtmlTables(markdown) {
  const customers = [];

  for (const table of String(markdown ?? '').match(/<table\b[\s\S]*?<\/table>/gi) ?? []) {
    const rows = parseHtmlRows(table);
    const headerIndex = rows.findIndex((row) => row.map(getField).includes('sbg_number'));
    if (headerIndex < 0) continue;

    const fields = rows[headerIndex].map(getField);
    let values = null;

    const flush = () => {
      if (!values) return;
      const dates = collectDates(values.report_dates);
      const phones = collectPhones(values.phone_number);
      const customer = toCustomer({
        ...values,
        credit_date: dates.length > 1 ? dates.at(-2) : dates[0] ?? '',
        due_date: dates.at(-1) ?? '',
        phone_number: phones[0] ?? values.phone_number,
      });
      if (isCompleteCustomer(customer)) customers.push(customer);
      values = null;
    };

    for (const row of rows.slice(headerIndex + 1)) {
      const mapped = {};
      fields.forEach((field, index) => {
        if (field && row[index]) mapped[field] = row[index];
      });

      if (String(mapped.sbg_number ?? '').replace(/\D/g, '').length >= 10) {
        flush();
        values = mapped;
        continue;
      }
      if (!values) continue;

      Object.entries(mapped).forEach(([field, value]) => {
        if (field === 'name' && looksLikeAddress(value)) {
          values.alamat = [values.alamat, value].filter(Boolean).join(' ');
          return;
        }
        if (field === 'barang_jaminan') {
          values[field] = [values[field], value].filter(Boolean).join(' ');
          return;
        }
        values[field] = [values[field], value].filter(Boolean).join(' ');
      });
    }
    flush();
  }

  return customers;
}

function parseKeyValueRecords(markdown) {
  const customers = [];
  let values = {};

  const flush = () => {
    const customer = toCustomer(values);
    if (isCompleteCustomer(customer)) customers.push(customer);
    values = {};
  };

  for (const line of markdown.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:[-*]\s*)?([^:]+):\s*(.+?)\s*$/);
    if (!match) continue;

    const field = getField(match[1]);
    if (!field) continue;
    if (field === 'sbg_number' && values.sbg_number) flush();
    values[field] = match[2];
  }

  flush();
  return customers;
}

const PEGADAIAN_RECORD_START = /^\s*\d+\s+(\d{10,})\s+([A-Z0-9]+)\s*-\s*([A-Z0-9]+)\s+/;
const REPORT_DATE = /\b\d{2}[-/]\d{2}[-/]\d{4}\b/;
const REPORT_AMOUNTS = /\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)\s*$/;

function findPhone(value) {
  const candidates = String(value ?? '').match(/(?:\+?62|0)8(?:[\s.-]?\d){7,11}/g) ?? [];
  return candidates.find((candidate) => normalizeIndonesianWhatsAppNumber(candidate)) ?? '';
}

function parsePegadaianLayoutPage(page) {
  const lines = page.split(/\r?\n/);
  const header = lines.find((line) => line.includes('Nasabah') && line.includes('Telp/HP.')) ?? '';
  const nameStart = header ? Math.max(header.indexOf('Nasabah') - 9, 0) : 43;
  const phoneStart = nameStart + 28;
  const creditStart = nameStart + 53;
  const collateralStart = nameStart + 70;
  const collateralEnd = nameStart + 135;
  const starts = lines
    .map((line, index) => PEGADAIAN_RECORD_START.test(line) ? index : -1)
    .filter((index) => index >= 0);
  const customers = [];

  starts.forEach((start, recordIndex) => {
    const end = starts[recordIndex + 1] ?? lines.length;
    const block = lines.slice(start, end);
    const firstLine = block[0];
    const identity = firstLine.match(PEGADAIAN_RECORD_START);
    const amounts = firstLine.match(REPORT_AMOUNTS);
    if (!identity || !amounts) return;

    const creditDate = firstLine.slice(creditStart - 3, collateralStart).match(REPORT_DATE)?.[0] ?? '';
    const phoneNumber = block
      .map((line) => findPhone(line.slice(phoneStart - 2, creditStart + 1)))
      .find(Boolean) ?? '';

    let secondaryRowStarted = false;
    const nameParts = [cleanText(firstLine.slice(nameStart, phoneStart - 2))];
    const addressParts = [];
    const collateralParts = [];
    let dueDate = '';

    block.forEach((line, lineIndex) => {
      if (lineIndex > 0 && /^\s*(?:-|\d{6,})\s+/.test(line)) {
        secondaryRowStarted = true;
      }

      if (lineIndex > 0) {
        const customerColumn = cleanText(line.slice(nameStart, phoneStart - 2));
        if (customerColumn) {
          if (secondaryRowStarted) addressParts.push(customerColumn);
          else nameParts.push(customerColumn);
        }
      }

      const collateral = cleanText(line.slice(collateralStart, collateralEnd));
      if (collateral && !/^(?:Barang Jaminan|Taksiran)$/i.test(collateral)) {
        collateralParts.push(collateral);
      }

      if (lineIndex > 0 && !dueDate) {
        dueDate = line.slice(creditStart - 3, collateralStart).match(REPORT_DATE)?.[0] ?? '';
      }
    });

    const customer = toCustomer({
      sbg_number: identity[1],
      rubrik: `${identity[2]} - ${identity[3]}`,
      name: nameParts.join(' '),
      phone_number: phoneNumber,
      credit_date: creditDate,
      due_date: dueDate,
      loan_value: amounts[2],
      barang_jaminan: collateralParts.join(' '),
      taksiran: amounts[1],
      sewa_modal: amounts[3],
      alamat: addressParts.join(' '),
      status: '',
    });
    if (isCompleteCustomer(customer)) customers.push(customer);
  });

  return customers;
}

function parsePegadaianLayoutText(text) {
  return text.split(/\f/).flatMap(parsePegadaianLayoutPage);
}

function parseGadaiOcrOutput(markdown) {
  if (typeof markdown !== 'string' || !markdown.trim()) return [];

  const customers = [
    ...parseMarkdownTables(markdown),
    ...parseHtmlTables(markdown),
    ...parseKeyValueRecords(markdown),
    ...parsePegadaianLayoutText(markdown),
  ];
  const seen = new Set();
  return customers.filter((customer) => {
    if (seen.has(customer.sbg_number)) return false;
    seen.add(customer.sbg_number);
    return true;
  });
}

function filterGadaiCustomersByPrefix(customers, prefix) {
  if (!/^\d{5}$/.test(String(prefix ?? ''))) return [];
  return customers.filter((customer) =>
    String(customer.sbg_number ?? '').replace(/\D/g, '').startsWith(prefix)
  );
}

module.exports = { parseGadaiOcrOutput, filterGadaiCustomersByPrefix };
