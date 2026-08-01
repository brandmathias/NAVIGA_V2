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

test('RapidDoc runner preserves photographed gadai columns from OCR coordinates', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'naviga-rapid-doc-image-runner-test-'));
  const moduleDirectory = join(directory, 'rapidocr');
  const inputPath = join(directory, 'gadai.png');
  const outputPath = join(directory, 'gadai.md');
  const python = join(process.cwd(), '.tools', 'rapid-doc', 'Scripts', 'python.exe');
  const runner = join(process.cwd(), 'scripts', 'rapid-doc-extract.py');

  await mkdir(moduleDirectory);
  await writeFile(inputPath, 'png');
  await writeFile(join(moduleDirectory, '__init__.py'), [
    'class RapidDoc:',
    '    pass',
    'class Result:',
    "    img = type('Image', (), {'shape': (500, 1110)})()",
    "    boxes = [[[38, 34], [134, 34], [134, 46], [38, 46]], [[217, 34], [330, 34], [330, 46], [217, 46]], [[350, 58], [426, 58], [426, 72], [350, 72]], [[471, 33], [530, 33], [530, 47], [471, 47]], [[471, 58], [530, 58], [530, 72], [471, 72]]]",
    "    txts = ('1178725010004741', 'ESRYANTI MASAMBE', '081218539816', '08-04-2025', '05-08-2025')",
    '    scores = (1, 1, 1, 1, 1)',
    'class RapidOCR:',
    '    def __call__(self, input_path):',
    '        return Result()',
  ].join('\n'));

  try {
    await execFile(python, [runner, '--gadai-table', inputPath, outputPath], {
      env: { ...process.env, PYTHONPATH: directory },
      windowsHide: true,
    });

    const markdown = await readFile(outputPath, 'utf8');
    assert.match(markdown, /<td>1178725010004741<\/td>/);
    assert.match(markdown, /<td>ESRYANTI MASAMBE<\/td>/);
    assert.match(markdown, /<td>081218539816<\/td>/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('RapidDoc runner scales gadai OCR columns to the uploaded image width', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'naviga-rapid-doc-scaled-image-runner-test-'));
  const moduleDirectory = join(directory, 'rapidocr');
  const inputPath = join(directory, 'gadai.png');
  const outputPath = join(directory, 'gadai.md');
  const python = join(process.cwd(), '.tools', 'rapid-doc', 'Scripts', 'python.exe');
  const runner = join(process.cwd(), 'scripts', 'rapid-doc-extract.py');

  await mkdir(moduleDirectory);
  await writeFile(inputPath, 'png');
  await writeFile(join(moduleDirectory, '__init__.py'), [
    'class Result:',
    "    img = type('Image', (), {'shape': (1000, 2220)})()",
    "    boxes = [[[76, 68], [268, 68], [268, 92], [76, 92]], [[434, 68], [660, 68], [660, 92], [434, 92]], [[700, 116], [852, 116], [852, 144], [700, 144]], [[942, 66], [1060, 66], [1060, 94], [942, 94]], [[942, 116], [1060, 116], [1060, 144], [942, 144]], [[2078, 68], [2152, 68], [2152, 92], [2078, 92]]]",
    "    txts = ('1178725010004741', 'ESRYANTI MASAMBE', '081218539816', '08-04-2025', '05-08-2025', '39,200')",
    '    scores = (1, 1, 1, 1, 1, 1)',
    'class RapidOCR:',
    '    def __call__(self, input_path):',
    '        return Result()',
  ].join('\n'));

  try {
    await execFile(python, [runner, '--gadai-table', inputPath, outputPath], {
      env: { ...process.env, PYTHONPATH: directory },
      windowsHide: true,
    });

    assert.match(await readFile(outputPath, 'utf8'), /<td>1178725010004741<\/td>/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('RapidDoc runner anchors gadai columns to an inset table header', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'naviga-rapid-doc-inset-gadai-test-'));
  const moduleDirectory = join(directory, 'rapidocr');
  const inputPath = join(directory, 'gadai.png');
  const outputPath = join(directory, 'gadai.md');
  const python = join(process.cwd(), '.tools', 'rapid-doc', 'Scripts', 'python.exe');
  const runner = join(process.cwd(), 'scripts', 'rapid-doc-extract.py');

  await mkdir(moduleDirectory);
  await writeFile(inputPath, 'png');
  await writeFile(join(moduleDirectory, '__init__.py'), [
    'class Result:',
    "    img = type('Image', (), {'shape': (1080, 1920)})()",
    "    boxes = [[[145, 250], [185, 250], [185, 270], [145, 270]], [[188, 250], [367, 250], [367, 270], [188, 270]], [[367, 250], [457, 250], [457, 270], [367, 270]], [[457, 250], [659, 250], [659, 270], [457, 270]], [[659, 250], [809, 250], [809, 270], [659, 270]], [[809, 250], [957, 250], [957, 270], [809, 270]], [[957, 250], [1348, 250], [1348, 270], [957, 270]], [[1348, 250], [1491, 250], [1491, 270], [1348, 270]], [[1491, 250], [1635, 250], [1635, 270], [1491, 270]], [[1635, 250], [1748, 250], [1748, 270], [1635, 270]], [[150, 290], [170, 290], [170, 310], [150, 310]], [[190, 290], [365, 290], [365, 310], [190, 310]], [[460, 290], [650, 290], [650, 310], [460, 310]], [[665, 290], [805, 290], [805, 310], [665, 310]], [[815, 290], [950, 290], [950, 310], [815, 310]], [[1500, 290], [1625, 290], [1625, 310], [1500, 310]]]",
    "    txts = ('No.', 'No. SBG', 'Rubrik', 'Nasabah', 'Telp/HP.', 'Tgl Kredit', 'Barang Jaminan', 'Taksiran', 'Uang Pinjaman', 'SM', '1', '1178725010004741', 'ESRYANTI MASAMBE', '081218539816', '05-08-2025', '490,000')",
    '    scores = tuple(1 for _ in txts)',
    'class RapidOCR:',
    '    def __call__(self, input_path):',
    '        return Result()',
  ].join('\n'));

  try {
    await execFile(python, [runner, '--gadai-table', inputPath, outputPath], {
      env: { ...process.env, PYTHONPATH: directory },
      windowsHide: true,
    });

    assert.match(await readFile(outputPath, 'utf8'), /<td>1178725010004741<\/td>/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('RapidDoc runner converts a photographed installment sheet into rows', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'naviga-rapid-doc-installment-test-'));
  const moduleDirectory = join(directory, 'rapidocr');
  const inputPath = join(directory, 'angsuran.png');
  const outputPath = join(directory, 'angsuran.md');
  const python = join(process.cwd(), '.tools', 'rapid-doc', 'Scripts', 'python.exe');
  const runner = join(process.cwd(), 'scripts', 'rapid-doc-extract.py');

  await mkdir(moduleDirectory);
  await writeFile(inputPath, 'png');
  await writeFile(join(moduleDirectory, '__init__.py'), [
    'class Result:',
    "    img = type('Image', (), {'shape': (1080, 1920)})()",
    "    boxes = [[[20, 355], [100, 355], [100, 370], [20, 370]], [[347, 355], [420, 355], [420, 370], [347, 370]], [[1281, 355], [1430, 355], [1430, 370], [1281, 370]], [[5, 387], [15, 387], [15, 402], [5, 402]], [[21, 387], [220, 387], [220, 402], [21, 402]], [[348, 387], [560, 387], [560, 402], [348, 402]], [[703, 387], [770, 387], [770, 402], [703, 402]], [[784, 387], [850, 387], [850, 402], [784, 402]], [[863, 387], [875, 387], [875, 402], [863, 402]], [[917, 385], [970, 385], [970, 402], [917, 402]], [[991, 385], [1055, 385], [1055, 402], [991, 402]], [[1106, 387], [1270, 387], [1270, 402], [1106, 402]], [[1280, 387], [1430, 387], [1430, 402], [1280, 402]], [[20, 1000], [90, 1000], [90, 1015], [20, 1015]], [[348, 1000], [365, 1000], [365, 1015], [348, 1015]]]",
    "    txts = ('Nasabah', 'Produk', 'Kunjungan Terakhir', '4', 'FERSI IMANUEL MARTHENS', 'MULIA ULTIMATE KONVEN', '1,634,550', '1,634,550', '4', '0 0/12', '153,905', '0 11793 - UPC RANOTANA', '2025-08-22 09:35:22', 'Sheet1', '+')",
    '    scores = tuple(1 for _ in txts)',
    'class RapidOCR:',
    '    def __call__(self, input_path):',
    '        return Result()',
  ].join('\n'));

  try {
    await execFile(python, [runner, '--installment-table', inputPath, outputPath], {
      env: { ...process.env, PYTHONPATH: directory },
      windowsHide: true,
    });

    const markdown = await readFile(outputPath, 'utf8');
    assert.match(markdown, /\| FERSI IMANUEL MARTHENS \|/);
    assert.match(markdown, /11793 - UPC RANOTANA/);
    assert.doesNotMatch(markdown, /Sheet1/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
