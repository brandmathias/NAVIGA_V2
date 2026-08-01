import { headers } from 'next/headers';
import { auth } from '@/lib/auth.mjs';
import { getUnitById } from '@/lib/naviga-directory.mjs';

export type LocalSession = {
  name: string;
  email: string;
  role: 'superadmin' | 'unit';
  unitId: string | null;
  unitName: string | null;
  unitPrefix: string | null;
  unitCode: string | null;
  unitDomicile: string | null;
  unitProvince: string | null;
  unitPhone: string | null;
  unitAddress: string | null;
  unitMapUrl: string | null;
  unitManagers: Array<{ name: string; nip: string; phone: string }>;
  unitAppraisers: Array<{ name: string; nip: string; phone: string }>;
  upc: string;
  expiresAt: number;
};

export class LocalAuthError extends Error {
  status = 401;
  constructor(message = 'Sesi login tidak valid atau telah berakhir.') {
    super(message);
    this.name = 'LocalAuthError';
  }
}

export async function getSession(): Promise<LocalSession | null> {
  const result = await auth.api.getSession({ headers: await headers() });
  if (!result?.user || !result.session) return null;

  const user = result.user as typeof result.user & { role?: string; unitId?: string | null; phone?: string | null };
  const role = user.role === 'superadmin' ? 'superadmin' : user.role === 'unit' ? 'unit' : null;
  if (!role) return null;

  const unit = role === 'unit' && user.unitId ? await getUnitById(user.unitId) : null;
  if (role === 'unit' && (!unit || !unit.active)) return null;

  return {
    name: user.name,
    email: user.email,
    role,
    unitId: unit?.id ?? null,
    unitName: unit?.name ?? null,
    unitPrefix: unit?.prefix ?? null,
    unitCode: unit?.unitCode ?? null,
    unitDomicile: unit?.domicile ?? null,
    unitProvince: unit?.province ?? null,
    unitPhone: unit?.phone ?? null,
    unitAddress: unit?.address ?? null,
    unitMapUrl: unit?.mapUrl ?? null,
    unitManagers: unit?.managers ?? [],
    unitAppraisers: unit?.appraisers ?? [],
    upc: unit?.name ?? 'all',
    expiresAt: new Date(result.session.expiresAt).getTime(),
  };
}

export async function requireSession(): Promise<LocalSession> {
  const session = await getSession();
  if (!session) throw new LocalAuthError();
  return session;
}
