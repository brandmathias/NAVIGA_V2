import type { Pool } from 'pg';
import type { LocalSession } from '@/lib/auth-session';
import type { TaskBoardData } from '@/types';
import { createDefaultTaskBoardData } from '@/lib/task-board-defaults';
import { getPostgresPool } from '@/lib/postgres';
import { validateTaskBoardData } from '@/lib/task-board-validation.mjs';
import { creatorFromSession, normalizeTaskBoardData } from '@/lib/task-board-contract.mjs';

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

type TaskCreator = { userId: string; name: string };

function readRowBoardData(value: unknown, fallbackCreator: TaskCreator, options: { previousBoardData?: TaskBoardData; forceCreator?: boolean } = {}) {
  const rawBoardData = typeof value === 'string' ? JSON.parse(value) : value;
  const boardData = normalizeTaskBoardData(rawBoardData, fallbackCreator, options);
  const validation = validateTaskBoardData(boardData);
  if (!validation.valid) throw new Error(`Data board di database tidak valid: ${'message' in validation ? validation.message : 'struktur tidak valid'}`);
  return {
    boardData: boardData as TaskBoardData,
    migrated: JSON.stringify(rawBoardData) !== JSON.stringify(boardData),
  };
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

export async function getTaskBoard(scopeKey: string, session: LocalSession) {
  const pool = getPostgresPool();
  await ensureSchema(pool);
  const client = await pool.connect();
  const creator = creatorFromSession(session);
  try {
    const result = await client.query('SELECT board_data, version, updated_at FROM naviga_task_boards WHERE scope_key = $1', [scopeKey]);
    if (result.rowCount === 0) {
      return { boardData: createDefaultTaskBoardData(creator), version: 0, updatedAt: null as string | null, needsMigration: false };
    }

    const row = result.rows[0];
    const parsed = readRowBoardData(row.board_data, creator);
    return {
      boardData: parsed.boardData,
      version: Number(row.version),
      updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
      needsMigration: parsed.migrated,
    };
  } finally {
    client.release();
  }
}

export async function saveTaskBoard(scopeKey: string, boardData: TaskBoardData, expectedVersion: number, session: LocalSession) {
  if (!Number.isInteger(expectedVersion) || expectedVersion < 0) {
    const error = new Error('Versi board tugas tidak valid.');
    (error as Error & { status?: number }).status = 400;
    throw error;
  }

  const pool = getPostgresPool();
  await ensureSchema(pool);
  const client = await pool.connect();
  const creator = creatorFromSession(session);
  try {
    await client.query('BEGIN');

    if (expectedVersion === 0) {
      const initialBoardData = normalizeTaskBoardData(boardData, creator, { forceCreator: true }) as TaskBoardData;
      const initialValidation = validateTaskBoardData(initialBoardData);
      if (!initialValidation.valid) {
        const error = new Error('message' in initialValidation ? initialValidation.message : 'Data board tugas tidak valid.');
        error.name = 'TaskBoardValidationError';
        (error as Error & { status?: number }).status = 400;
        throw error;
      }
      const inserted = await client.query(
        `INSERT INTO naviga_task_boards (scope_key, board_data, version, updated_at)
         VALUES ($1, $2::jsonb, 1, NOW())
         ON CONFLICT (scope_key) DO NOTHING
         RETURNING board_data, version, updated_at`,
        [scopeKey, JSON.stringify(initialBoardData)],
      );
      if (inserted.rowCount === 1) {
        await client.query('COMMIT');
        const row = inserted.rows[0];
        return { boardData: readRowBoardData(row.board_data, creator).boardData, version: Number(row.version), updatedAt: new Date(row.updated_at).toISOString(), needsMigration: false };
      }
    }

    const current = await client.query('SELECT board_data, version FROM naviga_task_boards WHERE scope_key = $1 FOR UPDATE', [scopeKey]);
    if (current.rowCount !== 1 || Number(current.rows[0].version) !== expectedVersion) {
      await client.query('ROLLBACK');
      throw new TaskBoardConflictError();
    }

    const previousBoardData = readRowBoardData(current.rows[0].board_data, creator).boardData;
    const nextBoardData = normalizeTaskBoardData(boardData, creator, { previousBoardData }) as TaskBoardData;
    const validation = validateTaskBoardData(nextBoardData);
    if (!validation.valid) {
      const error = new Error('message' in validation ? validation.message : 'Data board tugas tidak valid.');
      error.name = 'TaskBoardValidationError';
      (error as Error & { status?: number }).status = 400;
      throw error;
    }

    const updated = await client.query(
      `UPDATE naviga_task_boards
       SET board_data = $2::jsonb, version = version + 1, updated_at = NOW()
       WHERE scope_key = $1 AND version = $3
       RETURNING board_data, version, updated_at`,
      [scopeKey, JSON.stringify(nextBoardData), expectedVersion],
    );
    if (updated.rowCount !== 1) {
      await client.query('ROLLBACK');
      throw new TaskBoardConflictError();
    }

    await client.query('COMMIT');
    const row = updated.rows[0];
    return { boardData: readRowBoardData(row.board_data, creator).boardData, version: Number(row.version), updatedAt: new Date(row.updated_at).toISOString(), needsMigration: false };
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
