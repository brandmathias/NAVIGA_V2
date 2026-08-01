import nextEnv from '@next/env';
import { Client } from 'pg';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) throw new Error('DATABASE_URL belum dikonfigurasi.');

const adminUrl = new URL(databaseUrl);
adminUrl.pathname = '/postgres';
const client = new Client({ connectionString: adminUrl.toString() });

try {
  await client.connect();
  const existing = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', ['naviga']);
  if (!existing.rowCount) await client.query('CREATE DATABASE naviga');
  console.log(JSON.stringify({ database: 'naviga', created: !existing.rowCount }));
} finally {
  await client.end();
}
