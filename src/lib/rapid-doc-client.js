const { execFile: execFileCallback } = require('node:child_process');
const { access, mkdtemp, readFile, rm, writeFile } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { promisify } = require('node:util');

const execFile = promisify(execFileCallback);

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function extractRapidDocMarkdown(pdf, options) {
  if (!Buffer.isBuffer(pdf) || !pdf.length) throw new Error('File PDF kosong.');

  const workDir = await mkdtemp(join(tmpdir(), 'naviga-rapid-doc-'));
  const inputPath = join(workDir, 'gadai.pdf');
  const outputPath = join(workDir, 'gadai.md');

  try {
    await writeFile(inputPath, pdf);
    const { stderr } = await execFile(options.command, [...(options.args ?? []), inputPath, outputPath], {
      timeout: options.timeoutMs,
      windowsHide: true,
      maxBuffer: 1_024 * 1_024,
    });

    if (!(await pathExists(outputPath))) {
      throw new Error(stderr?.trim() || 'RapidDoc tidak menghasilkan Markdown OCR.');
    }

    const markdown = await readFile(outputPath, 'utf8');
    if (!markdown.trim()) throw new Error('RapidDoc selesai tanpa teks OCR. Pastikan PDF dapat dibaca.');
    return markdown;
  } catch (error) {
    if (error && error.killed) {
      throw new Error('RapidDoc melebihi batas waktu pemrosesan PDF. Tutup aplikasi berat lalu coba lagi.');
    }
    if (error && error.code === 'ENOENT') {
      throw new Error('OCR RapidDoc belum dipasang. Jalankan scripts/setup-local-pdf.ps1 terlebih dahulu.');
    }
    throw error;
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

module.exports = { extractRapidDocMarkdown };
