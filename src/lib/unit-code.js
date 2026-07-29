const INDONESIAN_PROVINCES = Object.freeze([
  'Aceh', 'Bali', 'Banten', 'Bengkulu', 'DI Yogyakarta', 'DKI Jakarta', 'Gorontalo', 'Jambi', 'Jawa Barat', 'Jawa Tengah', 'Jawa Timur', 'Kalimantan Barat', 'Kalimantan Selatan', 'Kalimantan Tengah', 'Kalimantan Timur', 'Kalimantan Utara', 'Kepulauan Bangka Belitung', 'Kepulauan Riau', 'Lampung', 'Maluku', 'Maluku Utara', 'Nusa Tenggara Barat', 'Nusa Tenggara Timur', 'Papua', 'Papua Barat', 'Papua Barat Daya', 'Papua Pegunungan', 'Papua Selatan', 'Papua Tengah', 'Riau', 'Sulawesi Barat', 'Sulawesi Selatan', 'Sulawesi Tengah', 'Sulawesi Tenggara', 'Sulawesi Utara', 'Sumatera Barat', 'Sumatera Selatan', 'Sumatera Utara',
]);

const PROVINCE_DISPLAY_CODES = Object.freeze({
  Aceh: 'BNA', Bali: 'DPS', Banten: 'SRG', Bengkulu: 'BKL', 'DI Yogyakarta': 'YGY', 'DKI Jakarta': 'JKT', Gorontalo: 'GTO', Jambi: 'JMB', 'Jawa Barat': 'BDG', 'Jawa Tengah': 'SMG', 'Jawa Timur': 'SBY',
  'Kalimantan Barat': 'PTK', 'Kalimantan Selatan': 'BJM', 'Kalimantan Tengah': 'PLK', 'Kalimantan Timur': 'SMR', 'Kalimantan Utara': 'TJS', 'Kepulauan Bangka Belitung': 'PGK', 'Kepulauan Riau': 'TPI', Lampung: 'BDL',
  Maluku: 'AMQ', 'Maluku Utara': 'TTE', 'Nusa Tenggara Barat': 'MTR', 'Nusa Tenggara Timur': 'KPG', Papua: 'JYP', 'Papua Barat': 'MKW', 'Papua Barat Daya': 'SOQ', 'Papua Pegunungan': 'WMN', 'Papua Selatan': 'MRK', 'Papua Tengah': 'NBR', Riau: 'PKU',
  'Sulawesi Barat': 'MJU', 'Sulawesi Selatan': 'MKS', 'Sulawesi Tengah': 'PLW', 'Sulawesi Tenggara': 'KDI', 'Sulawesi Utara': 'MND', 'Sumatera Barat': 'PDG', 'Sumatera Selatan': 'PLB', 'Sumatera Utara': 'MDN',
});

function formatUnitCode(domicile, prefix) {
  const cleanPrefix = String(prefix ?? '').trim();
  const domicileText = String(domicile ?? '').trim();
  const letters = domicileText.toUpperCase().replace(/[^A-Z]/g, '');
  if (!/^\d{5}$/.test(cleanPrefix) || !letters) return '';
  const code = PROVINCE_DISPLAY_CODES[domicileText] ?? (letters.replace(/[AIUEO]/g, '') + letters).slice(0, 3).padEnd(3, 'X');
  return `CP-${code}-${cleanPrefix}`;
}

module.exports = { INDONESIAN_PROVINCES, formatUnitCode };
