import nextEnv from '@next/env';
import { Client } from 'pg';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const client = new Client({ connectionString: process.env.DATABASE_URL });
try {
  await client.connect();
  const [users, units, accountTables] = await Promise.all([
    client.query('SELECT role, COUNT(*)::int AS count FROM "user" GROUP BY role ORDER BY role'),
    client.query('SELECT COUNT(*)::int AS count FROM naviga_units'),
    client.query(`SELECT to_regclass('public.naviga_profile_photos') AS profile_photos, to_regclass('public.naviga_login_history') AS login_history`),
  ]);
  console.log(JSON.stringify({ roles: users.rows, units: units.rows[0].count, accountTables: accountTables.rows[0] }));
} finally {
  await client.end();
}
