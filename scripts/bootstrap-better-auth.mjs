import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());
const { bootstrapDirectory } = await import('../src/lib/naviga-directory.mjs');
const result = await bootstrapDirectory();
console.log(JSON.stringify(result));
