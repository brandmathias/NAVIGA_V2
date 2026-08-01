const { parseInstallmentRows } = require('./installment-import');

function splitMarkdownRow(line) {
  const trimmed = String(line ?? '').trim();
  if (!trimmed.includes('|')) return null;

  const withoutEdges = trimmed.replace(/^\|/, '').replace(/\|$/, '');
  const cells = [];
  let current = '';
  let escaped = false;

  for (const character of withoutEdges) {
    if (escaped) {
      current += character;
      escaped = false;
    } else if (character === '\\') {
      escaped = true;
    } else if (character === '|') {
      cells.push(current.replace(/<br\s*\/?>/gi, '\n').trim());
      current = '';
    } else {
      current += character;
    }
  }
  cells.push(current.replace(/<br\s*\/?>/gi, '\n').trim());
  return cells;
}

function isSeparatorRow(row) {
  return row.length > 0 && row.every((cell) => /^:?-{3,}:?$/.test(String(cell).trim()));
}

function isInstallmentHeader(row) {
  const normalize = (value) => String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  return ['nasabah', 'namanasabah'].includes(normalize(row[0])) && normalize(row[1]) === 'produk';
}

/** Converts RapidDoc Markdown tables from an Angsuran photo to the existing XLSX row schema. */
function parseInstallmentOcrOutput(markdown) {
  const rows = String(markdown ?? '')
    .split(/\r?\n/)
    .map(splitMarkdownRow)
    .filter(Boolean)
    .filter((row) => !isSeparatorRow(row));

  const headerIndex = rows.findIndex(isInstallmentHeader);
  if (headerIndex < 0) return [];

  return parseInstallmentRows(rows.slice(headerIndex));
}

module.exports = { parseInstallmentOcrOutput };
