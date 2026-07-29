import assert from 'node:assert/strict';
import { execFile as execFileCallback } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';

const execFile = promisify(execFileCallback);

test('RapidDoc runner keeps table recognition while skipping formula recognition', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'naviga-rapid-doc-runner-test-'));
  const moduleDirectory = join(directory, 'rapid_doc');
  const inputPath = join(directory, 'gadai.pdf');
  const outputPath = join(directory, 'gadai.md');
  const python = join(process.cwd(), '.tools', 'rapid-doc', 'Scripts', 'python.exe');
  const runner = join(process.cwd(), 'scripts', 'rapid-doc-extract.py');

  await mkdir(moduleDirectory);
  await writeFile(inputPath, '%PDF-1.7');
  await writeFile(join(moduleDirectory, '__init__.py'), [
    'class Result:',
    "    markdown = '| No. SBG | Nama Nasabah |\\n| --- | --- |\\n| 117870123456 | Siti Aminah |'",
    'class RapidDoc:',
    '    def __init__(self, formula_enable=True, table_enable=True, lang="ch", pdf_pages_batch=64):',
    '        if formula_enable or not table_enable or lang != "en" or pdf_pages_batch != 1:',
    "            raise RuntimeError('runner must use English OCR, tables, no formula, and one-page batches')",
    '    def __call__(self, input_paths, output_dir):',
    '        return [Result()]',
  ].join('\n'));

  try {
    await execFile(python, [runner, inputPath, outputPath], {
      env: { ...process.env, PYTHONPATH: directory },
      windowsHide: true,
    });

    assert.match(await readFile(outputPath, 'utf8'), /117870123456/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
