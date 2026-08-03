import type { Pool, QueryResultRow } from 'pg';
import type { LocalSession } from '@/lib/auth-session';
import { getPostgresPool } from '@/lib/postgres';

export type BroadcastHistoryType = 'Gadaian Broadcast' | 'Angsuran Broadcast';

export type BroadcastHistoryInput = {
  type: BroadcastHistoryType;
  customerName: string;
  customerIdentifier: string;
  status: string;
  template: string;
  timestamp?: string;
  legacyId?: string;
};

export type BroadcastHistoryItem = {
  id: string;
  timestamp: string;
  type: BroadcastHistoryType;
  customerName: string;
  customerIdentifier: string;
  status: string;
  adminUser: string;
  template: string;
};

const schemaReady = new WeakMap<object, Promise<void>>();

const CREATE_BROADCAST_HISTORY_TABLE = `
  CREATE TABLE IF NOT EXISTS naviga_broadcast_history (
    id TEXT PRIMARY KEY CHECK (length(trim(id)) > 0),
    scope_key TEXT NOT NULL CHECK (length(trim(scope_key)) > 0),
    type TEXT NOT NULL CHECK (type IN ('Gadaian Broadcast', 'Angsuran Broadcast')),
    customer_name TEXT NOT NULL CHECK (length(trim(customer_name)) BETWEEN 1 AND 255),
    customer_identifier TEXT NOT NULL CHECK (length(trim(customer_identifier)) BETWEEN 1 AND 120),
    status TEXT NOT NULL CHECK (length(trim(status)) BETWEEN 1 AND 80),
    template TEXT NOT NULL CHECK (length(trim(template)) BETWEEN 1 AND 80),
    created_by_user_id TEXT NOT NULL CHECK (length(trim(created_by_user_id)) > 0),
    created_by_name TEXT NOT NULL CHECK (length(trim(created_by_name)) BETWEEN 1 AND 255),
    legacy_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE UNIQUE INDEX IF NOT EXISTS naviga_broadcast_history_legacy_idx
    ON naviga_broadcast_history (scope_key, legacy_id)
    WHERE legacy_id IS NOT NULL;
  CREATE INDEX IF NOT EXISTS naviga_broadcast_history_scope_created_idx
    ON naviga_broadcast_history (scope_key, created_at DESC);
`;

function invalidInput(message: string): never {
  const error = new Error(message) as Error & { status?: number };
  error.status = 400;
  throw error;
}
function textValue(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== 'string') invalidInput(`${field} wajib berupa teks.`);
  const normalized = value.trim();
  if (!normalized) invalidInput(`${field} wajib diisi.`);
  if (normalized.length > maxLength) invalidInput(`${field} terlalu panjang.`);
  return normalized;
}

function normalizeInput(rawInput: BroadcastHistoryInput): BroadcastHistoryInput {
  if (!rawInput || typeof rawInput !== 'object') invalidInput('Data riwayat broadcast tidak valid.');
  if (rawInput.type !== 'Gadaian Broadcast' && rawInput.type !== 'Angsuran Broadcast') {
    invalidInput('Jenis riwayat broadcast tidak valid.');
  }

  let timestamp: string | undefined;
  if (rawInput.timestamp !== undefined) {
    const date = new Date(textValue(rawInput.timestamp, 'timestamp', 64));
    if (Number.isNaN(date.getTime())) invalidInput('Waktu riwayat broadcast tidak valid.');
    timestamp = date.toISOString();
  }

  return {
    type: rawInput.type,
    customerName: textValue(rawInput.customerName, 'customerName', 255),
    customerIdentifier: textValue(rawInput.customerIdentifier, 'customerIdentifier', 120),
    status: textValue(rawInput.status, 'status', 80),
    template: textValue(rawInput.template, 'template', 80),
    ...(timestamp ? { timestamp } : {}),
    ...(rawInput.legacyId !== undefined ? { legacyId: textValue(rawInput.legacyId, 'legacyId', 200) } : {}),
  };
}

async function ensureSchema(pool: Pool) {
  const poolKey = pool as unknown as object;
  const cached = schemaReady.get(poolKey);
  if (cached) return cached;

  const promise = pool.query(CREATE_BROADCAST_HISTORY_TABLE).then(() => undefined).catch((error) => {
    schemaReady.delete(poolKey);
    throw error;
  });
  schemaReady.set(poolKey, promise);
  return promise;
}

export function scopeForSession(session: LocalSession): string {
  if (session.role === 'superadmin') return `superadmin:${session.userId}`;
  return `unit:${session.unitId ?? session.unitPrefix ?? session.upc}`;
}

function newHistoryId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `broadcast-history-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function toHistoryItem(row: QueryResultRow): BroadcastHistoryItem {
  return {
    id: String(row.id),
    timestamp: new Date(row.created_at as string | Date).toISOString(),
    type: row.type as BroadcastHistoryType,
    customerName: String(row.customer_name),
    customerIdentifier: String(row.customer_identifier),
    status: String(row.status),
    adminUser: String(row.created_by_name),
    template: String(row.template),
  };
}

export async function listBroadcastHistory(session: LocalSession): Promise<BroadcastHistoryItem[]> {
  const pool = getPostgresPool();
  await ensureSchema(pool);
  const isSuperadmin = session.role === 'superadmin';
  const result = await pool.query(
    `SELECT id, type, customer_name, customer_identifier, status, template, created_by_name, created_at
       FROM naviga_broadcast_history
      ${isSuperadmin ? '' : 'WHERE scope_key = $1'}
      ORDER BY created_at DESC
      LIMIT 500`,
    isSuperadmin ? [] : [scopeForSession(session)],
  );
  return result.rows.map(toHistoryItem);
}

export async function saveBroadcastHistoryEntry(
  session: LocalSession,
  rawInput: BroadcastHistoryInput,
): Promise<BroadcastHistoryItem> {
  const input = normalizeInput(rawInput);
  const pool = getPostgresPool();
  await ensureSchema(pool);
  const scopeKey = scopeForSession(session);
  const id = newHistoryId();
  const result = await pool.query(
    `INSERT INTO naviga_broadcast_history
      (id, scope_key, type, customer_name, customer_identifier, status, template,
       created_by_user_id, created_by_name, legacy_id, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, COALESCE($11::timestamptz, NOW()))
     ${input.legacyId ? 'ON CONFLICT (scope_key, legacy_id) WHERE legacy_id IS NOT NULL DO NOTHING' : ''}
     RETURNING id, type, customer_name, customer_identifier, status, template, created_by_name, created_at`,
    [
      id,
      scopeKey,
      input.type,
      input.customerName,
      input.customerIdentifier,
      input.status,
      input.template,
      session.userId,
      session.name,
      input.legacyId ?? null,
      input.timestamp ?? null,
    ],
  );

  if (result.rowCount) return toHistoryItem(result.rows[0]);
  const existing = await pool.query(
    `SELECT id, type, customer_name, customer_identifier, status, template, created_by_name, created_at
       FROM naviga_broadcast_history
      WHERE scope_key = $1 AND legacy_id = $2`,
    [scopeKey, input.legacyId],
  );
  if (!existing.rowCount) invalidInput('Riwayat broadcast lama tidak dapat disimpan.');
  return toHistoryItem(existing.rows[0]);
}

export async function saveBroadcastHistoryEntries(
  session: LocalSession,
  inputs: BroadcastHistoryInput[],
): Promise<BroadcastHistoryItem[]> {
  if (inputs.length > 500) invalidInput('Migrasi riwayat broadcast terlalu besar.');
  const items: BroadcastHistoryItem[] = [];
  for (const input of inputs) {
    items.push(await saveBroadcastHistoryEntry(session, input));
  }
  return items;
}

export async function clearBroadcastHistory(session: LocalSession): Promise<void> {
  const pool = getPostgresPool();
  await ensureSchema(pool);
  if (session.role === 'superadmin') {
    await pool.query('DELETE FROM naviga_broadcast_history');
    return;
  }
  await pool.query('DELETE FROM naviga_broadcast_history WHERE scope_key = $1', [scopeForSession(session)]);
}
