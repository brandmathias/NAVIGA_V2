'use server';

import { extractGadaiMarkdown } from '@/lib/local-pdf-extractor';
import { extractGadaiImageMarkdown } from '@/lib/local-image-extractor';
import { filterGadaiCustomersByPrefix, parseGadaiOcrOutput } from '@/lib/gadai-ocr-parser';
import { requireSession } from '@/lib/auth-session';
import { listUnits } from '@/lib/naviga-directory.mjs';
import type { BroadcastCustomer } from '@/types';

const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

type ParsedBroadcastCustomer = Omit<BroadcastCustomer, 'follow_up_status'>;

function validateImage(file: FormDataEntryValue | null): File {
  if (!(file instanceof File) || file.size === 0) {
    throw new Error('File foto belum dipilih atau kosong.');
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('Ukuran foto maksimal 10 MB.');
  }
  if (!SUPPORTED_IMAGE_TYPES.has(file.type) || !/\.(jpg|jpeg|png|webp)$/i.test(file.name)) {
    throw new Error('Foto harus berformat JPG, JPEG, PNG, atau WEBP.');
  }
  return file;
}

async function getAllowedPrefixes(session: Awaited<ReturnType<typeof requireSession>>) {
  const activePrefixes = (await listUnits())
    .filter((unit) => unit.active)
    .map((unit) => unit.prefix);

  if (session.role === 'superadmin') return activePrefixes;
  if (session.unitPrefix && activePrefixes.includes(session.unitPrefix)) return [session.unitPrefix];
  throw new Error('Akun unit tidak aktif atau belum memiliki prefix SBG.');
}

/**
 * Extracts gadai records with local deterministic parsing and CPU OCR fallback.
 * Session scope is enforced here before results are returned to the browser.
 */
export async function parsePdf(formData: FormData): Promise<BroadcastCustomer[]> {
  const session = await requireSession();
  const file = formData.get('pdf-file');

  if (!(file instanceof File) || file.size === 0) {
    throw new Error('File PDF belum dipilih atau kosong.');
  }
  if (file.size > MAX_PDF_SIZE_BYTES) {
    throw new Error('Ukuran PDF maksimal 10 MB.');
  }
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('File harus berformat PDF.');
  }

  const markdown = await extractGadaiMarkdown(Buffer.from(await file.arrayBuffer()));
  const extracted = parseGadaiOcrOutput(markdown) as ParsedBroadcastCustomer[];

  if (!extracted.length) {
    throw new Error('Ekstraksi PDF lokal tidak menemukan data gadai yang lengkap. Periksa kualitas dan format dokumen.');
  }

  const prefixes = await getAllowedPrefixes(session);
  const scoped = prefixes.flatMap((prefix) =>
    filterGadaiCustomersByPrefix(extracted, prefix) as ParsedBroadcastCustomer[]
  );
  if (!scoped.length) {
    throw new Error('Tidak ada data gadai untuk unit aktif pada PDF ini.');
  }

  return scoped.map((customer) => ({
    ...customer,
    follow_up_status: 'dihubungi',
  }));
}

/** Extracts gadai records from a photo and enforces the signed session's unit scope. */
export async function parseGadaiImage(formData: FormData): Promise<BroadcastCustomer[]> {
  const session = await requireSession();
  const file = validateImage(formData.get('gadai-image'));
  const markdown = await extractGadaiImageMarkdown(Buffer.from(await file.arrayBuffer()), file.name);
  const extracted = parseGadaiOcrOutput(markdown) as ParsedBroadcastCustomer[];

  if (!extracted.length) {
    throw new Error('Ekstraksi foto lokal tidak menemukan data gadai yang lengkap. Pastikan tabel terlihat tajam dan utuh.');
  }

  const scoped = (await getAllowedPrefixes(session)).flatMap((prefix) =>
    filterGadaiCustomersByPrefix(extracted, prefix) as ParsedBroadcastCustomer[]
  );
  if (!scoped.length) {
    throw new Error('Tidak ada data gadai untuk unit aktif pada foto ini.');
  }

  return scoped.map((customer) => ({ ...customer, follow_up_status: 'dihubungi' }));
}
