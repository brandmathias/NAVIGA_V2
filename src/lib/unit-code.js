const INDONESIAN_PROVINCES = Object.freeze([
  'Aceh', 'Bali', 'Banten', 'Bengkulu', 'DI Yogyakarta', 'DKI Jakarta', 'Gorontalo', 'Jambi', 'Jawa Barat', 'Jawa Tengah', 'Jawa Timur', 'Kalimantan Barat', 'Kalimantan Selatan', 'Kalimantan Tengah', 'Kalimantan Timur', 'Kalimantan Utara', 'Kepulauan Bangka Belitung', 'Kepulauan Riau', 'Lampung', 'Maluku', 'Maluku Utara', 'Nusa Tenggara Barat', 'Nusa Tenggara Timur', 'Papua', 'Papua Barat', 'Papua Barat Daya', 'Papua Pegunungan', 'Papua Selatan', 'Papua Tengah', 'Riau', 'Sulawesi Barat', 'Sulawesi Selatan', 'Sulawesi Tengah', 'Sulawesi Tenggara', 'Sulawesi Utara', 'Sumatera Barat', 'Sumatera Selatan', 'Sumatera Utara',
]);

function formatUnitCode(domicile, prefix) {
  const cleanPrefix = String(prefix ?? '').trim();
  const letters = String(domicile ?? '').toUpperCase().replace(/[^A-Z]/g, '');
  if (!/^\d{5}$/.test(cleanPrefix) || !letters) return '';
  const code = (letters.replace(/[AIUEO]/g, '') + letters).slice(0, 3).padEnd(3, 'X');
  return `CP-${code}-${cleanPrefix}`;
}

module.exports = { INDONESIAN_PROVINCES, formatUnitCode };
