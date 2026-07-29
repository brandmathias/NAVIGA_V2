import assert from 'node:assert/strict';
import { execFile as execFileCallback } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';

const execFile = promisify(execFileCallback);

test('native PDF runner preserves page layout and page boundaries', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'naviga-native-runner-test-'));
  const moduleDirectory = join(directory, 'pypdf');
  const inputPath = join(directory, 'gadai.pdf');
  const outputPath = join(directory, 'gadai.txt');
  const python = join(process.cwd(), '.tools', 'rapid-doc', 'Scripts', 'python.exe');
  const runner = join(process.cwd(), 'scripts', 'pdf-text-extract.py');

  await mkdir(moduleDirectory);
  await writeFile(inputPath, '%PDF-1.7');
  await writeFile(join(moduleDirectory, '__init__.py'), [
    'class Page:',
    '    def __init__(self, text): self.text = text',
    '    def extract_text(self, extraction_mode=None):',
    "        if extraction_mode != 'layout': raise RuntimeError('layout mode is required')",
    '        return self.text',
    'class PdfReader:',
    '    def __init__(self, input_path, strict=True):',
    "        if strict: raise RuntimeError('non-strict parsing is required')",
    "        self.pages = [Page('PAGE ONE'), Page('PAGE TWO')]",
  ].join('\n'));

  try {
    await execFile(python, [runner, inputPath, outputPath], {
      env: { ...process.env, PYTHONPATH: directory },
      windowsHide: true,
    });

    assert.equal(await readFile(outputPath, 'utf8'), 'PAGE ONE\n\f\nPAGE TWO');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
