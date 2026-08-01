import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-session';
import { listUnitAdmins, listUnits } from '@/lib/naviga-directory.mjs';
import UnitManagementClient from './unit-management-client';

export default async function UnitManagementPage({ searchParams }: { searchParams: Promise<{ dialog?: string }> }) {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'superadmin') redirect('/dashboard');

  const [{ dialog }, [units, admins]] = await Promise.all([searchParams, Promise.all([listUnits(), listUnitAdmins()])]);
  return <UnitManagementClient units={units} admins={admins} openAdminDialog={dialog === 'admin'} />;
}
