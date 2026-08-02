import type { Pool } from 'pg';
import { getPostgresPool } from '@/lib/postgres';
import { MAX_TASK_ATTACHMENT_SIZE_BYTES } from '@/lib/task-attachments.mjs';

const schemaReady = new WeakMap<object, Promise<void>>();

const CREATE_TASK_ATTACHMENTS_TABLE = `
  CREATE TABLE IF NOT EXISTS naviga_task_attachments (
    id TEXT PRIMARY KEY CHECK (length(trim(id)) > 0),
    scope_key TEXT NOT NULL CHECK (length(trim(scope_key)) > 0),
    name TEXT NOT NULL CHECK (length(trim(name)) > 0 AND length(name) <= 255),
    mime_type TEXT NOT NULL DEFAULT 'application/octet-stream' CHECK (length(mime_type) <= 120),
    size_bytes INTEGER NOT NULL CHECK (size_bytes > 0 AND size_bytes <= ${MAX_TASK_ATTACHMENT_SIZE_BYTES}),
    content_bytes BYTEA NOT NULL,
    created_by_user_id TEXT NOT NULL CHECK (length(trim(created_by_user_id)) > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS naviga_task_attachments_scope_idx
    ON naviga_task_attachments (scope_key, created_at DESC);
`;

export type TaskAttachmentMetadata = {
  id: string;
  name: string;
  type: string;
  size: number;
};

export type StoredTaskAttachment = TaskAttachmentMetadata & {
  content: Buffer;
};

type SaveTaskAttachmentInput = TaskAttachmentMetadata & {
  scopeKey: string;
  createdByUserId: string;
  content: Buffer;
};

function sanitizeFilename(value: string) {
  const normalized = value.replace(/[\\/\0\r\n]+/g, ' ').trim();
  return normalized.slice(0, 255) || 'Lampiran tugas';
}

function normalizeMimeType(value: string) {
  const normalized = value.trim();
  return normalized.slice(0, 120) || 'application/octet-stream';
}

async function ensureSchema(pool: Pool) {
  const poolKey = pool as unknown as object;
  const cached = schemaReady.get(poolKey);
  if (cached) return cached;

  const promise = pool.query(CREATE_TASK_ATTACHMENTS_TABLE).then(() => undefined).catch((error) => {
    schemaReady.delete(poolKey);
    throw error;
  });
  schemaReady.set(poolKey, promise);
  return promise;
}

function validateInput(input: SaveTaskAttachmentInput) {
  if (!input.id.trim() || !input.scopeKey.trim() || !input.createdByUserId.trim()) {
    throw Object.assign(new Error('Identitas lampiran tidak valid.'), { status: 400 });
  }
  if (!Number.isInteger(input.size) || input.size <= 0 || input.size > MAX_TASK_ATTACHMENT_SIZE_BYTES) {
    throw Object.assign(new Error('Ukuran file maksimal 10 MB.'), { status: 400 });
  }
  if (!Buffer.isBuffer(input.content) || input.content.length !== input.size) {
    throw Object.assign(new Error('Isi lampiran tidak valid.'), { status: 400 });
  }
}

function metadataFromRow(row: { id: string; name: string; mime_type: string; size_bytes: number }) {
  return {
    id: String(row.id),
    name: String(row.name),
    type: String(row.mime_type || 'application/octet-stream'),
    size: Number(row.size_bytes),
  } satisfies TaskAttachmentMetadata;
}

export async function saveTaskAttachment(input: SaveTaskAttachmentInput): Promise<TaskAttachmentMetadata> {
  validateInput(input);
  const pool = getPostgresPool();
  await ensureSchema(pool);
  const result = await pool.query(
    `INSERT INTO naviga_task_attachments
      (id, scope_key, name, mime_type, size_bytes, content_bytes, created_by_user_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, name, mime_type, size_bytes`,
    [
      input.id,
      input.scopeKey,
      sanitizeFilename(input.name),
      normalizeMimeType(input.type),
      input.size,
      input.content,
      input.createdByUserId,
    ],
  );
  return metadataFromRow(result.rows[0]);
}

export async function getTaskAttachment(id: string, scopeKey: string): Promise<StoredTaskAttachment | null> {
  const normalizedId = String(id ?? '').trim();
  if (!normalizedId || !scopeKey.trim()) return null;

  const pool = getPostgresPool();
  await ensureSchema(pool);
  const result = await pool.query(
    `SELECT id, name, mime_type, size_bytes, content_bytes
       FROM naviga_task_attachments
      WHERE id = $1 AND scope_key = $2`,
    [normalizedId, scopeKey],
  );
  const row = result.rows[0];
  if (!row) return null;
  return { ...metadataFromRow(row), content: row.content_bytes as Buffer };
}

export async function deleteTaskAttachment(id: string, scopeKey: string): Promise<boolean> {
  const normalizedId = String(id ?? '').trim();
  if (!normalizedId || !scopeKey.trim()) return false;

  const pool = getPostgresPool();
  await ensureSchema(pool);
  const result = await pool.query(
    'DELETE FROM naviga_task_attachments WHERE id = $1 AND scope_key = $2 RETURNING id',
    [normalizedId, scopeKey],
  );
  return result.rowCount === 1;
}
