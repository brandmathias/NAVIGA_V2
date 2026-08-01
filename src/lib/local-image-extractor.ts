import { extname, join } from 'node:path';
import rapidDocClient from './rapid-doc-client';

const { extractRapidDocMarkdown } = rapidDocClient;

const SUPPORTED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const DEFAULT_LOCAL_IMAGE_TIMEOUT_MS = 180_000;
const MAX_LOCAL_IMAGE_TIMEOUT_MS = 300_000;

function getTimeoutMs() {
  const configured = Number(process.env.LOCAL_IMAGE_TIMEOUT_MS ?? process.env.LOCAL_PDF_TIMEOUT_MS);
  if (!Number.isFinite(configured)) return DEFAULT_LOCAL_IMAGE_TIMEOUT_MS;
  return Math.min(Math.max(Math.floor(configured), 1_000), MAX_LOCAL_IMAGE_TIMEOUT_MS);
}

function rapidDocPython() {
  const configured = process.env.RAPID_DOC_PYTHON?.trim();
  if (configured) return configured;

  return process.platform === 'win32'
    ? join(process.cwd(), '.tools', 'rapid-doc', 'Scripts', 'python.exe')
    : join(process.cwd(), '.tools', 'rapid-doc', 'bin', 'python');
}

/** Extracts a supported image locally with RapidDoc and removes its temporary file afterward. */
export async function extractImageMarkdown(image: Buffer, filename: string) {
  if (!image.length) throw new Error('File foto kosong.');

  const extension = extname(filename).toLowerCase();
  if (!SUPPORTED_IMAGE_EXTENSIONS.has(extension)) {
    throw new Error('Foto harus berformat JPG, JPEG, PNG, atau WEBP.');
  }

  return extractRapidDocMarkdown(image, {
    command: rapidDocPython(),
    args: [join(process.cwd(), 'scripts', 'rapid-doc-extract.py')],
    fileLabel: 'foto',
    inputName: `foto${extension}`,
    timeoutMs: getTimeoutMs(),
  });
}

/** Extracts gadai photos with OCR coordinates so table columns remain aligned. */
export async function extractGadaiImageMarkdown(image: Buffer, filename: string) {
  if (!image.length) throw new Error('File foto kosong.');

  const extension = extname(filename).toLowerCase();
  if (!SUPPORTED_IMAGE_EXTENSIONS.has(extension)) {
    throw new Error('Foto harus berformat JPG, JPEG, PNG, atau WEBP.');
  }

  return extractRapidDocMarkdown(image, {
    command: rapidDocPython(),
    args: [join(process.cwd(), 'scripts', 'rapid-doc-extract.py'), '--gadai-table'],
    fileLabel: 'foto',
    inputName: `foto${extension}`,
    timeoutMs: getTimeoutMs(),
  });
}

/** Extracts Angsuran screenshots with the lightweight coordinate-aware OCR path. */
export async function extractInstallmentImageMarkdown(image: Buffer, filename: string) {
  if (!image.length) throw new Error('File foto kosong.');

  const extension = extname(filename).toLowerCase();
  if (!SUPPORTED_IMAGE_EXTENSIONS.has(extension)) {
    throw new Error('Foto harus berformat JPG, JPEG, PNG, atau WEBP.');
  }

  return extractRapidDocMarkdown(image, {
    command: rapidDocPython(),
    args: [join(process.cwd(), 'scripts', 'rapid-doc-extract.py'), '--installment-table'],
    fileLabel: 'foto',
    inputName: `foto${extension}`,
    timeoutMs: getTimeoutMs(),
  });
}
