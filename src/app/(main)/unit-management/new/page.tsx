import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-session';
import { listUnits } from '@/lib/naviga-directory.mjs';
import UnitCreateClient from './unit-create-client';

export default async function NewUnitPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'superadmin') redirect('/dashboard');

  const { mode } = await searchParams;
  if (mode === 'admin') redirect('/unit-management?dialog=admin');
  return <UnitCreateClient units={await listUnits()} mode="unit" />;
}
