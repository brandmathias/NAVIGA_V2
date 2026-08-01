import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

test('returns Markdown produced by the local RapidDoc runner', async () => {
  const { extractRapidDocMarkdown } = await import('../src/lib/rapid-doc-client.js');
  const directory = await mkdtemp(join(tmpdir(), 'naviga-rapid-doc-test-'));
  const runnerPath = join(directory, 'runner.mjs');

  await writeFile(runnerPath, [
    "import { writeFile } from 'node:fs/promises';",
    'const [, , inputPath, outputPath] = process.argv;',
    "if (!inputPath.endsWith('.pdf')) throw new Error('PDF input is required');",
    "await writeFile(outputPath, '| No. SBG | Nama Nasabah |\\n| --- | --- |\\n| 117870123456 | Siti Aminah |');",
  ].join('\n'));

  try {
    const markdown = await extractRapidDocMarkdown(Buffer.from('%PDF-1.7'), {
      command: process.execPath,
      args: [runnerPath],
      timeoutMs: 3_000,
    });

    assert.match(markdown, /117870123456/);
    assert.match(markdown, /Siti Aminah/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('passes a safe image extension to the local RapidDoc runner', async () => {
  const { extractRapidDocMarkdown } = await import('../src/lib/rapid-doc-client.js');
  const directory = await mkdtemp(join(tmpdir(), 'naviga-rapid-doc-image-test-'));
  const runnerPath = join(directory, 'runner.mjs');

  await writeFile(runnerPath, [
    "import { writeFile } from 'node:fs/promises';",
    'const [, , inputPath, outputPath] = process.argv;',
    "if (!inputPath.endsWith('.png')) throw new Error('PNG input is required');",
    "await writeFile(outputPath, '| Nasabah | Produk |\\n| --- | --- |\\n| Siti | KCA |');",
  ].join('\n'));

  try {
    const markdown = await extractRapidDocMarkdown(Buffer.from('png'), {
      command: process.execPath,
      args: [runnerPath],
      fileLabel: 'foto',
      inputName: '../../foto-tabel.png',
      timeoutMs: 3_000,
    });

    assert.match(markdown, /Siti/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
