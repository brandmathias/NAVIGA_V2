import { redirect } from 'next/navigation';
import { getSession } from '@/lib/local-auth';
import { listUnits } from '@/lib/unit-registry';
import UnitCreateClient from './unit-create-client';

export default async function NewUnitPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'superadmin') redirect('/dashboard');

  const { mode } = await searchParams;
  return <UnitCreateClient units={await listUnits()} mode={mode === 'admin' ? 'admin' : 'unit'} />;
}
