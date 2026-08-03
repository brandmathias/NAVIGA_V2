const BROADCAST_HISTORY_API = '/api/broadcast-history';

async function readError(response, fallback) {
  try {
    const payload = await response.json();
    if (payload?.error) return payload.error;
  } catch {
    // Keep a stable user-facing fallback for an empty or invalid response.
  }
  return fallback;
}
function metadataOnly(entry) {
  return {
    type: entry.type,
    customerName: entry.customerName,
    customerIdentifier: entry.customerIdentifier,
    status: entry.status,
    template: entry.template,
    ...(entry.timestamp ? { timestamp: entry.timestamp } : {}),
    ...(entry.legacyId ? { legacyId: entry.legacyId } : {}),
  };
}

export async function createBroadcastHistoryEntry(entry) {
  const response = await fetch(BROADCAST_HISTORY_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify(metadataOnly(entry)),
  });
  if (!response.ok) throw new Error(await readError(response, 'Riwayat broadcast belum tersimpan.'));
  const payload = await response.json();
  return payload.item;
}

export async function migrateLegacyBroadcastHistory(entries) {
  if (!entries.length) return [];
  const response = await fetch(BROADCAST_HISTORY_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({ entries: entries.map(metadataOnly) }),
  });
  if (!response.ok) throw new Error(await readError(response, 'Riwayat lama belum dapat dipindahkan.'));
  const payload = await response.json();
  return payload.items ?? [];
}

export async function getBroadcastHistory() {
  const response = await fetch(BROADCAST_HISTORY_API, { cache: 'no-store' });
  if (!response.ok) throw new Error(await readError(response, 'Riwayat broadcast belum dapat dimuat.'));
  const payload = await response.json();
  return payload.items ?? [];
}

export async function clearBroadcastHistory() {
  const response = await fetch(BROADCAST_HISTORY_API, {
    method: 'DELETE',
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(await readError(response, 'Riwayat broadcast belum dapat dihapus.'));
}
