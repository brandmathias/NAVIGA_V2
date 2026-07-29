import { join } from 'node:path';
import { parseGadaiOcrOutput } from './gadai-ocr-parser';
import fallbackClient from './local-pdf-fallback';
import nativePdfClient from './native-pdf-client';
import rapidDocClient from './rapid-doc-client';

const { extractPreferredPdfMarkdown } = fallbackClient;
const { extractNativePdfText } = nativePdfClient;
const { extractRapidDocMarkdown } = rapidDocClient;

const DEFAULT_LOCAL_PDF_TIMEOUT_MS = 180_000;
const MAX_LOCAL_PDF_TIMEOUT_MS = 300_000;
const DEFAULT_NATIVE_PDF_TIMEOUT_MS = 30_000;

function getTimeoutMs() {
  const configured = Number(process.env.LOCAL_PDF_TIMEOUT_MS);
  if (!Number.isFinite(configured)) return DEFAULT_LOCAL_PDF_TIMEOUT_MS;
  return Math.min(Math.max(Math.floor(configured), 1_000), MAX_LOCAL_PDF_TIMEOUT_MS);
}

function getNativeTimeoutMs() {
  const configured = Number(process.env.NATIVE_PDF_TIMEOUT_MS);
  if (!Number.isFinite(configured)) return DEFAULT_NATIVE_PDF_TIMEOUT_MS;
  return Math.min(Math.max(Math.floor(configured), 1_000), 60_000);
}

function rapidDocPython() {
  const configured = process.env.RAPID_DOC_PYTHON?.trim();
  if (configured) return configured;

  return process.platform === 'win32'
    ? join(process.cwd(), '.tools', 'rapid-doc', 'Scripts', 'python.exe')
    : join(process.cwd(), '.tools', 'rapid-doc', 'bin', 'python');
}

async function extractWithRapidDoc(pdf: Buffer) {
  return extractRapidDocMarkdown(pdf, {
    command: rapidDocPython(),
    args: [join(process.cwd(), 'scripts', 'rapid-doc-extract.py')],
    timeoutMs: getTimeoutMs(),
  });
}

async function extractWithNativePdf(pdf: Buffer) {
  return extractNativePdfText(pdf, {
    command: rapidDocPython(),
    args: [join(process.cwd(), 'scripts', 'pdf-text-extract.py')],
    timeoutMs: getNativeTimeoutMs(),
  });
}

/**
 * Extracts a PDF on this computer. Selectable-text PDFs use lightweight
 * layout-preserving parsing; only incomplete results load RapidDoc OCR.
 */
export async function extractGadaiMarkdown(pdf: Buffer) {
  if (!pdf.length) throw new Error('File PDF kosong.');

  return extractPreferredPdfMarkdown(pdf, {
    extractDigital: extractWithNativePdf,
    extractOcr: extractWithRapidDoc,
    isUsable: (markdown: string) => parseGadaiOcrOutput(markdown).length > 0,
  });
}
