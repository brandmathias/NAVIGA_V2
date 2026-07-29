const FONNTE_SEND_URL = 'https://api.fonnte.com/send';

if (process.env.NEXT_RUNTIME !== undefined) require('server-only');

function getFonnteStatus() {
  return { enabled: process.env.FONNTE_ENABLED === 'true' && Boolean(process.env.FONNTE_TOKEN) };
}

function validRecipient(recipient) {
  return recipient
    && typeof recipient.target === 'string' && recipient.target.trim()
    && typeof recipient.message === 'string' && recipient.message.trim();
}

async function queueFonnteMessages({ recipients, fetchImpl = fetch }) {
  if (!getFonnteStatus().enabled) return { accepted: 0, unavailable: true };

  const data = (Array.isArray(recipients) ? recipients : [])
    .filter(validRecipient)
    .map(({ target, message }) => ({ target, message, delay: '60' }));

  if (!data.length) return { accepted: 0 };

  const body = new FormData();
  body.set('data', JSON.stringify(data));
  const response = await fetchImpl(FONNTE_SEND_URL, {
    method: 'POST',
    headers: { Authorization: process.env.FONNTE_TOKEN },
    body,
  });

  if (!response.ok) throw new Error('Fonnte menolak antrean pesan.');

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error('Respons Fonnte tidak valid.');
  }

  if (!payload || typeof payload !== 'object' || payload.status !== true) {
    const reason = typeof payload?.reason === 'string'
      ? payload.reason.trim().slice(0, 300)
      : typeof payload?.message === 'string' ? payload.message.trim().slice(0, 300) : '';
    throw new Error(reason ? `Fonnte menolak antrean pesan: ${reason}` : 'Fonnte menolak antrean pesan.');
  }

  const id = Array.isArray(payload.id) ? payload.id[0] : payload.id;
  const reference = typeof id === 'string' || typeof id === 'number' ? String(id) : undefined;
  return reference ? { accepted: data.length, reference } : { accepted: data.length };
}

module.exports = { getFonnteStatus, queueFonnteMessages };
