function normalizeIndonesianWhatsAppNumber(value) {
  let digits = String(value ?? '').replace(/\D/g, '');
  if (digits.startsWith('0')) digits = `62${digits.slice(1)}`;
  if (!/^628\d{7,12}$/.test(digits)) return null;
  return digits;
}

module.exports = { normalizeIndonesianWhatsAppNumber };
