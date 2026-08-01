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

function safeInputName(inputName = 'document.pdf') {
  const matchedExtension = String(inputName).toLowerCase().match(/\.(pdf|jpe?g|png|webp)$/);
  return `document${matchedExtension ? matchedExtension[0] : '.pdf'}`;
}

async function extractRapidDocMarkdown(document, options) {
  const fileLabel = options.fileLabel ?? 'PDF';
  if (!Buffer.isBuffer(document) || !document.length) throw new Error(`File ${fileLabel} kosong.`);

  const workDir = await mkdtemp(join(tmpdir(), 'naviga-rapid-doc-'));
  const inputPath = join(workDir, safeInputName(options.inputName));
  const outputPath = join(workDir, 'gadai.md');

  try {
    await writeFile(inputPath, document);
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
      throw new Error(`RapidDoc melebihi batas waktu pemrosesan ${fileLabel}. Tutup aplikasi berat lalu coba lagi.`);
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
