import type { Pool } from 'pg';
import type { LocalSession } from '@/lib/auth-session';
import type { TaskBoardData } from '@/types';
import { createDefaultTaskBoardData } from '@/lib/task-board-defaults';
import { getPostgresPool } from '@/lib/postgres';
import { validateTaskBoardData } from '@/lib/task-board-validation.mjs';

const schemaReady = new WeakMap<object, Promise<void>>();

const CREATE_TASK_BOARD_TABLE = `
  CREATE TABLE IF NOT EXISTS naviga_task_boards (
    scope_key TEXT PRIMARY KEY CHECK (length(trim(scope_key)) > 0),
    board_data JSONB NOT NULL CHECK (jsonb_typeof(board_data) = 'object'),
    version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS naviga_task_boards_updated_at_idx
    ON naviga_task_boards (updated_at DESC);
`;

export class TaskBoardConflictError extends Error {
  status = 409;

  constructor() {
    super('Board tugas berubah di sesi lain. Muat ulang halaman sebelum menyimpan perubahan berikutnya.');
    this.name = 'TaskBoardConflictError';
  }
}

function readRowBoardData(value: unknown): TaskBoardData {
  const boardData = typeof value === 'string' ? JSON.parse(value) : value;
  const validation = validateTaskBoardData(boardData);
  if (!validation.valid) throw new Error(`Data board di database tidak valid: ${'message' in validation ? validation.message : 'struktur tidak valid'}`);
  return boardData as TaskBoardData;
}

async function ensureSchema(pool: Pool) {
  const poolKey = pool as unknown as object;
  const cached = schemaReady.get(poolKey);
  if (cached) return cached;

  const promise = pool.query(CREATE_TASK_BOARD_TABLE).then(() => undefined).catch((error) => {
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

export async function getTaskBoard(scopeKey: string) {
  const pool = getPostgresPool();
  await ensureSchema(pool);
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT board_data, version, updated_at FROM naviga_task_boards WHERE scope_key = $1', [scopeKey]);
    if (result.rowCount === 0) {
      return { boardData: createDefaultTaskBoardData(), version: 0, updatedAt: null as string | null };
    }

    const row = result.rows[0];
    return {
      boardData: readRowBoardData(row.board_data),
      version: Number(row.version),
      updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
    };
  } finally {
    client.release();
  }
}

export async function saveTaskBoard(scopeKey: string, boardData: TaskBoardData, expectedVersion: number) {
  const validation = validateTaskBoardData(boardData);
  if (!validation.valid) {
    const error = new Error('message' in validation ? validation.message : 'Data board tugas tidak valid.');
    error.name = 'TaskBoardValidationError';
    (error as Error & { status?: number }).status = 400;
    throw error;
  }
  if (!Number.isInteger(expectedVersion) || expectedVersion < 0) {
    const error = new Error('Versi board tugas tidak valid.');
    (error as Error & { status?: number }).status = 400;
    throw error;
  }

  const pool = getPostgresPool();
  await ensureSchema(pool);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (expectedVersion === 0) {
      const inserted = await client.query(
        `INSERT INTO naviga_task_boards (scope_key, board_data, version, updated_at)
         VALUES ($1, $2::jsonb, 1, NOW())
         ON CONFLICT (scope_key) DO NOTHING
         RETURNING board_data, version, updated_at`,
        [scopeKey, JSON.stringify(boardData)],
      );
      if (inserted.rowCount === 1) {
        await client.query('COMMIT');
        const row = inserted.rows[0];
        return { boardData: readRowBoardData(row.board_data), version: Number(row.version), updatedAt: new Date(row.updated_at).toISOString() };
      }
    }

    const updated = await client.query(
      `UPDATE naviga_task_boards
       SET board_data = $2::jsonb, version = version + 1, updated_at = NOW()
       WHERE scope_key = $1 AND version = $3
       RETURNING board_data, version, updated_at`,
      [scopeKey, JSON.stringify(boardData), expectedVersion],
    );
    if (updated.rowCount !== 1) {
      await client.query('ROLLBACK');
      throw new TaskBoardConflictError();
    }

    await client.query('COMMIT');
    const row = updated.rows[0];
    return { boardData: readRowBoardData(row.board_data), version: Number(row.version), updatedAt: new Date(row.updated_at).toISOString() };
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // Preserve the original database error.
    }
    throw error;
  } finally {
    client.release();
  }
}
