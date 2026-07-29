import { redirect } from 'next/navigation';
import { getSession } from '@/lib/local-auth';
import { listUnitAdmins, listUnits } from '@/lib/unit-registry';
import UnitManagementClient from './unit-management-client';

export default async function UnitManagementPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'superadmin') redirect('/dashboard');

  const [units, admins] = await Promise.all([listUnits(), listUnitAdmins()]);
  return <UnitManagementClient units={units} admins={admins} />;
}
