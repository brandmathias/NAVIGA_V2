import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/local-auth';
import { listUnitAdmins, listUnits } from '@/lib/unit-registry';
import UnitCreateClient from '../new/unit-create-client';

export default async function EditUnitPage({ params }: { params: Promise<{ unitId: string }> }) {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'superadmin') redirect('/dashboard');

  const { unitId } = await params;
  const [units, admins] = await Promise.all([listUnits(), listUnitAdmins()]);
  const unit = units.find((candidate) => candidate.id === unitId);
  if (!unit) notFound();

  return <UnitCreateClient units={units} mode="edit" unit={unit} relatedAdmins={admins.filter((admin) => admin.unitId === unit.id)} />;
}
