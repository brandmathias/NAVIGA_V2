const MAX_LEGACY_ENTRIES = 500;

function storageKeys(session) {
  if (session?.role === 'superadmin' || session?.upc === 'all') return ['broadcastHistory_all'];
  const keys = [session?.unitPrefix, session?.upc]
    .filter((value) => typeof value === 'string' && value.trim())
    .map((value) => `broadcastHistory_${value}`);
  return [...new Set(keys)];
}
function metadataOnly(entry) {
  if (!entry || typeof entry !== 'object') return null;
  if (entry.type !== 'Gadaian Broadcast' && entry.type !== 'Angsuran Broadcast') return null;
  const required = ['id', 'timestamp', 'customerName', 'customerIdentifier', 'status', 'template'];
  if (required.some((field) => typeof entry[field] !== 'string' || !entry[field].trim())) return null;
  return {
    legacyId: entry.id.trim().slice(0, 200),
    timestamp: entry.timestamp,
    type: entry.type,
    customerName: entry.customerName.trim().slice(0, 255),
    customerIdentifier: entry.customerIdentifier.trim().slice(0, 120),
    status: entry.status.trim().slice(0, 80),
    template: entry.template.trim().slice(0, 80),
  };
}

export function readLegacyBroadcastHistory(session, storage = window.localStorage) {
  const entries = [];
  for (const key of storageKeys(session)) {
    try {
      const parsed = JSON.parse(storage.getItem(key) || '[]');
      if (Array.isArray(parsed)) entries.push(...parsed.map(metadataOnly).filter(Boolean));
    } catch {
      // Ignore malformed browser-only data and continue with valid history.
    }
  }
  const unique = new Map(entries.map((entry) => [entry.legacyId, entry]));
  return [...unique.values()]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, MAX_LEGACY_ENTRIES);
}

export function removeLegacyBroadcastHistory(session, storage = window.localStorage) {
  for (const key of storageKeys(session)) storage.removeItem(key);
}
