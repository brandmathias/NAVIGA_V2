import { redirect } from 'next/navigation';
import MainShell from '@/components/main-shell';
import { getSession } from '@/lib/local-auth';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');

  return <MainShell user={session}>{children}</MainShell>;
}
