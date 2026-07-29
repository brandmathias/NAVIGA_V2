import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

test('returns layout text produced by the native PDF runner', async () => {
  const { extractNativePdfText } = await import('../src/lib/native-pdf-client.js');
  const directory = await mkdtemp(join(tmpdir(), 'naviga-native-pdf-test-'));
  const runnerPath = join(directory, 'runner.mjs');

  await writeFile(runnerPath, [
    "import { writeFile } from 'node:fs/promises';",
    'const [, , inputPath, outputPath] = process.argv;',
    "if (!inputPath.endsWith('.pdf')) throw new Error('PDF input is required');",
    "await writeFile(outputPath, 'DAFTAR KREDIT JATUH TEMPO\\n 1   1178726010000001');",
  ].join('\n'));

  try {
    const text = await extractNativePdfText(Buffer.from('%PDF-1.7'), {
      command: process.execPath,
      args: [runnerPath],
      timeoutMs: 3_000,
    });

    assert.match(text, /DAFTAR KREDIT JATUH TEMPO/);
    assert.match(text, /1178726010000001/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
