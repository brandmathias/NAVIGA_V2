import nextEnv from '@next/env';
import { getMigrations } from 'better-auth/db';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());
const { auth, ensureAccountDataSchema } = await import('../src/lib/auth.mjs');
const migrations = await getMigrations(auth.options);
await migrations.runMigrations();
await ensureAccountDataSchema();
console.log(JSON.stringify({ createdTables: migrations.toBeCreated.map((item) => item.table), addedFields: migrations.toBeAdded.length, accountTablesReady: true }));
