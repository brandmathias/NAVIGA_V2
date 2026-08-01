function parseIndonesianNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

  const input = String(value ?? '').trim().replace(/[^0-9,.-]/g, '');
  if (!input || input === '-') return 0;

  const commaIndex = input.lastIndexOf(',');
  const dotIndex = input.lastIndexOf('.');
  let normalized = input;

  if (commaIndex !== -1 && dotIndex !== -1) {
    const decimalIndex = Math.max(commaIndex, dotIndex);
    const groupingSeparator = decimalIndex === commaIndex ? /\./g : /,/g;
    normalized = input.replace(groupingSeparator, '').replace(decimalIndex === commaIndex ? ',' : '.', '.');
  } else if (commaIndex !== -1 || dotIndex !== -1) {
    const separator = commaIndex !== -1 ? ',' : '.';
    const separatorIndex = commaIndex !== -1 ? commaIndex : dotIndex;
    const digitsAfterSeparator = input.length - separatorIndex - 1;
    const separatorCount = input.split(separator).length - 1;

    normalized = separatorCount > 1 || digitsAfterSeparator === 3
      ? input.replace(new RegExp(`\\${separator}`, 'g'), '')
      : input.replace(separator, '.');
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function hasInstallmentHeader(row) {
  const nasabah = String(row[0] ?? '').trim().toLowerCase();
  const produk = String(row[1] ?? '').trim().toLowerCase();
  return (nasabah === 'nasabah' || nasabah === 'nama nasabah') && produk === 'produk';
}

function normalizeHeader(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function findColumn(rows, headers) {
  for (const row of rows) {
    if (!Array.isArray(row) || !hasInstallmentHeader(row)) continue;
    const index = row.findIndex(cell => headers.has(normalizeHeader(cell)));
    if (index >= 0) return index;
  }
  return -1;
}

function findPhoneColumn(rows) {
  return findColumn(rows, new Set(['nohp', 'nomorhp', 'notelepon', 'nomortelepon', 'notelp', 'telepon', 'telephone', 'phone', 'phonenumber']));
}

function findIdentifierColumn(rows) {
  return findColumn(rows, new Set(['nosbg', 'nomorsbg', 'nokredit', 'nomorkredit', 'nokontrak', 'nomorkontrak', 'noangsuran', 'nomorangsuran', 'norekening']));
}

function findVisitColumn(rows) {
  return findColumn(rows, new Set(['kunjunganterakhir', 'tglkunjunganterakhir', 'tanggalkunjunganterakhir']));
}

function getIdentifier(row, identifierColumn) {
  if (identifierColumn >= 0) return String(row[identifierColumn] ?? '').trim();
  return String(row[0] ?? '').match(/\d{5,}/)?.[0]
    ?? String(row[9] ?? '').match(/\b\d{5,}\b/)?.[0]
    ?? '';
}

function parseInstallmentRows(rows) {
  if (!Array.isArray(rows)) return [];
  const phoneColumn = findPhoneColumn(rows);
  const identifierColumn = findIdentifierColumn(rows);
  const visitColumn = findVisitColumn(rows);

  return rows
    .filter(Array.isArray)
    .filter(row => !hasInstallmentHeader(row))
    .map((row, index) => ({
      id: `row-${index + 1}`,
      nasabah: String(row[0] ?? '').trim(),
      produk: String(row[1] ?? '').trim(),
      pinjaman: parseIndonesianNumber(row[2]),
      osl: parseIndonesianNumber(row[3]),
      kol: parseIndonesianNumber(row[4]),
      hr_tung: parseIndonesianNumber(row[5]),
      tenor: String(row[6] ?? 'N/A').trim() || 'N/A',
      angsuran: parseIndonesianNumber(row[7]),
      kewajiban: parseIndonesianNumber(row[8]),
      pencairan: String(row[9] ?? '').trim(),
      account_number: getIdentifier(row, identifierColumn),
      kunjungan_terakhir: visitColumn >= 0 ? String(row[visitColumn] ?? 'N/A').trim() || 'N/A' : 'N/A',
      phone_number: phoneColumn >= 0 ? String(row[phoneColumn] ?? '').trim() : '',
      follow_up_status: 'dihubungi',
    }))
    .filter(customer => customer.nasabah && customer.produk);
}

function filterInstallmentCustomersByPrefix(customers, prefix) {
  if (!/^\d{5}$/.test(String(prefix ?? ''))) return [];
  return customers.filter((customer) =>
    String(customer.account_number ?? '').replace(/\D/g, '').startsWith(prefix)
  );
}

module.exports = { filterInstallmentCustomersByPrefix, parseIndonesianNumber, parseInstallmentRows };
