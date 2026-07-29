'use server';

import * as XLSX from 'xlsx';
import { filterInstallmentCustomersByPrefix, parseInstallmentRows } from '@/lib/installment-import';
import { requireSession } from '@/lib/local-auth';
import { listUnits } from '@/lib/unit-registry';
import type { InstallmentCustomer } from '@/types';

const MAX_XLSX_SIZE_BYTES = 10 * 1024 * 1024;

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
