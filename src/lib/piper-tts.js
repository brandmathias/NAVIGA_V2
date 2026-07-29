const DEFAULT_PIPER_BASE_URL = 'http://127.0.0.1:5000';
const DEFAULT_TIMEOUT_MS = 30_000;
const { requireLocalHttpUrl } = require('./local-service-url');

function piperError(message) {
  return new Error(message);
}

function isWav(bytes) {
  return bytes.length >= 12
    && bytes[0] === 82
    && bytes[1] === 73
    && bytes[2] === 70
    && bytes[3] === 70
    && bytes[8] === 87
    && bytes[9] === 65
    && bytes[10] === 86
    && bytes[11] === 69;
}

function piperSynthesizeUrl(baseUrl) {
  const url = requireLocalHttpUrl(baseUrl || DEFAULT_PIPER_BASE_URL, 'PIPER_BASE_URL');
  url.pathname = `${url.pathname.replace(/\/+$/, '')}/synthesize`;
  return url.toString();
}

async function synthesizePiperWav(text, options = {}) {
  const message = String(text ?? '').trim();
  if (!message) throw piperError('Teks pesan suara tidak boleh kosong.');

  const fetchImpl = options.fetchImpl || globalThis.fetch;
  if (typeof fetchImpl !== 'function') throw piperError('Layanan Piper tidak tersedia di server.');
  const endpoint = piperSynthesizeUrl(options.baseUrl || process.env.PIPER_BASE_URL);

  const controller = new AbortController();
  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let response;
    try {
      response = await fetchImpl(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text: message }),
        signal: controller.signal,
      });
    } catch (error) {
      if (error?.name === 'AbortError') {
        throw piperError('Piper tidak merespons sebelum batas waktu habis.');
      }
      throw piperError('Piper tidak dapat dihubungi. Jalankan layanan Piper lokal terlebih dahulu.');
    }

    if (!response.ok) {
      throw piperError(`Piper gagal membuat audio (HTTP ${response.status}).`);
    }

    const bytes = new Uint8Array(await response.arrayBuffer());
    if (!isWav(bytes)) {
      throw piperError('Piper mengembalikan audio dengan format WAV yang tidak valid.');
    }

    return `data:audio/wav;base64,${Buffer.from(bytes).toString('base64')}`;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { DEFAULT_PIPER_BASE_URL, synthesizePiperWav };
