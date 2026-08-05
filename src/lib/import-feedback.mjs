import { getUserFacingMessage } from './user-facing-message.mjs';

const domainCopy = {
  gadaian: {
    dataLabel: 'data gadaian',
    identifier: 'nomor SBG',
    columns: 'kolom nomor SBG, nama nasabah, dan tanggal jatuh tempo',
  },
  angsuran: {
    dataLabel: 'data angsuran',
    identifier: 'nomor kredit',
    columns: 'kolom nomor kredit, nama nasabah, dan nilai angsuran',
  },
};

const sourceLabel = {
  pdf: 'PDF',
  xlsx: 'XLSX',
  foto: 'foto tabel',
};

function copyFor(domain) {
  return domainCopy[domain];
}

function formatFileHint(domain, source) {
  if (source === 'pdf') return 'PDF atau foto tabel gadaian (JPG, PNG, atau WEBP)';
  if (source === 'xlsx') return 'XLSX atau foto tabel angsuran (JPG, PNG, atau WEBP)';
  return `foto tabel ${domain} yang jelas`;
}

export function getImportScopeLabel(session) {
  if (session.role !== 'unit') return 'unit aktif yang terdaftar';

  const unitName = session.unitName?.trim() || 'unit ini';
  const prefix = session.unitPrefix?.trim();
  return prefix ? `${unitName} (prefix SBG ${prefix})` : unitName;
}

export function getImportProcessingFeedback({ domain, source, session }) {
  const copy = copyFor(domain);
  const scope = getImportScopeLabel(session);

  return {
    title: `Menganalisis file ${domain}`,
    description: `Mengekstrak ${copy.dataLabel} lengkap dari ${sourceLabel[source]} lalu mencocokkan ${copy.identifier} dengan ${scope}.`,
  };
}

export function getImportSuccessDescription({ domain, session }, count) {
  const copy = copyFor(domain);
  return `${count} ${copy.dataLabel} dimuat untuk ${getImportScopeLabel(session)}.`;
}

export function getImportEmptyFeedback({ domain, source, session }) {
  const copy = copyFor(domain);
  const scope = getImportScopeLabel(session);

  return {
    title: `${copy.dataLabel[0].toUpperCase()}${copy.dataLabel.slice(1)} tidak ditemukan`,
    description: `${sourceLabel[source]} berhasil dibaca, tetapi tidak ditemukan ${copy.dataLabel} terkait unit ini (${scope}). Pastikan ${copy.identifier} pada file sesuai dengan unit aktif.`,
  };
}

export function getImportErrorFeedback(error, { domain, source, session }) {
  const copy = copyFor(domain);
  const message = getUserFacingMessage(error, '');

  if (/Tidak ada data (gadai|angsuran) untuk unit aktif/i.test(message)) {
    return getImportEmptyFeedback({ domain, source, session });
  }

  if (/Ekstraksi .*tidak menemukan/i.test(message)) {
    return {
      title: `${copy.dataLabel[0].toUpperCase()}${copy.dataLabel.slice(1)} belum terbaca`,
      description: `File ${sourceLabel[source]} berhasil dibaca, tetapi baris ${copy.dataLabel} lengkap belum ditemukan. Pastikan ${copy.columns} terlihat jelas lalu coba lagi.`,
    };
  }

  if (/Akun unit tidak aktif|belum memiliki prefix SBG/i.test(message)) {
    return {
      title: 'Unit belum siap digunakan',
      description: 'Akun ini belum memiliki unit aktif. Hubungi Superadmin untuk memeriksa penugasan unit dan nomor SBG.',
    };
  }

  if (message) {
    return { title: 'File tidak dapat digunakan', description: message };
  }

  return {
    title: 'File belum dapat dianalisis',
    description: `Periksa format ${formatFileHint(domain, source)}, pastikan ukurannya tidak lebih dari 10 MB, lalu coba lagi.`,
  };
}
