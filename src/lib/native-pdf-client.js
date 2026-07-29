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

async function extractNativePdfText(pdf, options) {
  if (!Buffer.isBuffer(pdf) || !pdf.length) throw new Error('File PDF kosong.');

  const workDir = await mkdtemp(join(tmpdir(), 'naviga-native-pdf-'));
  const inputPath = join(workDir, 'gadai.pdf');
  const outputPath = join(workDir, 'gadai.txt');

  try {
    await writeFile(inputPath, pdf);
    const { stderr } = await execFile(options.command, [...(options.args ?? []), inputPath, outputPath], {
      timeout: options.timeoutMs,
      windowsHide: true,
      maxBuffer: 512 * 1024,
    });

    if (!(await pathExists(outputPath))) {
      throw new Error(stderr?.trim() || 'Pembaca PDF lokal tidak menghasilkan teks.');
    }

    const text = await readFile(outputPath, 'utf8');
    if (!text.trim()) throw new Error('PDF tidak memiliki teks yang dapat dibaca langsung.');
    return text;
  } catch (error) {
    if (error && error.killed) {
      throw new Error('Pembacaan teks PDF lokal melebihi batas waktu.');
    }
    if (error && error.code === 'ENOENT') {
      throw new Error('Pembaca PDF lokal belum dipasang. Jalankan scripts/setup-local-pdf.ps1 terlebih dahulu.');
    }
    throw error;
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

module.exports = { extractNativePdfText };
