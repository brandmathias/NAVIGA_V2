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
  if (!getFonnteStatus().enabled) throw new Error('Fonnte belum diaktifkan atau token belum tersedia.');

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

  let payload = {};
  try {
    payload = await response.json();
  } catch {
    // Fonnte may return an empty response after accepting the queue.
  }

  return payload.id ? { accepted: data.length, reference: payload.id } : { accepted: data.length };
}

module.exports = { getFonnteStatus, queueFonnteMessages };
