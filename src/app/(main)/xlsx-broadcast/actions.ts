'use server';

import * as XLSX from 'xlsx';
import { extractInstallmentImageMarkdown } from '@/lib/local-image-extractor';
import { filterInstallmentCustomersByPrefix, parseInstallmentRows } from '@/lib/installment-import';
import installmentOcrParser from '@/lib/installment-ocr-parser';
import { requireSession } from '@/lib/auth-session';
import { listUnits } from '@/lib/naviga-directory.mjs';
import type { InstallmentCustomer } from '@/types';

const MAX_XLSX_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const { parseInstallmentOcrOutput } = installmentOcrParser;

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

/** Parses XLSX and enforces the signed session's registered unit scope. */
export async function parseXlsx(formData: FormData): Promise<InstallmentCustomer[]> {
  const session = await requireSession();
  const file = formData.get('xlsx-file');

  if (!(file instanceof File) || file.size === 0) {
    throw new Error('File XLSX belum dipilih atau kosong.');
  }
  if (file.size > MAX_XLSX_SIZE_BYTES) {
    throw new Error('Ukuran XLSX maksimal 10 MB.');
  }
  if (!file.name.toLowerCase().endsWith('.xlsx')) {
    throw new Error('File harus berformat XLSX.');
  }

  const workbook = XLSX.read(Buffer.from(await file.arrayBuffer()), { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error('File XLSX tidak memiliki lembar data.');

  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    header: 1,
    raw: false,
    defval: '',
  }) as unknown[][];
  const extracted = parseInstallmentRows(rows) as InstallmentCustomer[];
  if (!extracted.length) {
    throw new Error('Ekstraksi XLSX tidak menemukan data angsuran yang lengkap. Periksa format dokumen.');
  }

  const scoped = (await getAllowedPrefixes(session)).flatMap((prefix) =>
    filterInstallmentCustomersByPrefix(extracted, prefix) as InstallmentCustomer[]
  );
  if (!scoped.length) {
    throw new Error('Tidak ada data angsuran untuk unit aktif pada XLSX ini.');
  }

  return scoped;
}

/** Parses an Angsuran table photo locally and enforces the signed session's registered unit scope. */
export async function parseInstallmentImage(formData: FormData): Promise<InstallmentCustomer[]> {
  const session = await requireSession();
  const file = validateImage(formData.get('angsuran-image'));
  const markdown = await extractInstallmentImageMarkdown(Buffer.from(await file.arrayBuffer()), file.name);
  const extracted = parseInstallmentOcrOutput(markdown) as InstallmentCustomer[];

  if (!extracted.length) {
    throw new Error('Ekstraksi foto lokal tidak menemukan tabel angsuran yang lengkap. Pastikan judul kolom dan seluruh baris terlihat tajam.');
  }

  const scoped = (await getAllowedPrefixes(session)).flatMap((prefix) =>
    filterInstallmentCustomersByPrefix(extracted, prefix) as InstallmentCustomer[]
  );
  if (!scoped.length) {
    throw new Error('Tidak ada data angsuran untuk unit aktif pada foto ini.');
  }

  return scoped;
}
