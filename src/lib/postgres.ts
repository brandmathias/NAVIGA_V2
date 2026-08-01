import { Pool } from 'pg';

type NavigaGlobal = typeof globalThis & {
  __navigaPostgresPool?: Pool;
};

export class DatabaseConfigurationError extends Error {
  status = 503;

  constructor() {
    super('DATABASE_URL belum dikonfigurasi. Tambahkan koneksi PostgreSQL pada environment aplikasi.');
    this.name = 'DatabaseConfigurationError';
  }
}

export function getPostgresPool(): Pool {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) throw new DatabaseConfigurationError();

  const globalState = globalThis as NavigaGlobal;
  if (!globalState.__navigaPostgresPool) {
    const useSsl = process.env.DATABASE_SSL === 'true' || /sslmode=require/i.test(databaseUrl);
    globalState.__navigaPostgresPool = new Pool({
      connectionString: databaseUrl,
      max: process.env.NODE_ENV === 'production' ? 10 : 5,
      connectionTimeoutMillis: 5_000,
      idleTimeoutMillis: 30_000,
      ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
    });
  }

  return globalState.__navigaPostgresPool;
}
