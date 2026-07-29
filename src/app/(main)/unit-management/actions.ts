'use server';

import { revalidatePath } from 'next/cache';
import { requireSession } from '@/lib/local-auth';
import { registerUnit } from '@/lib/unit-registry';

async function requireSuperadmin() {
  const session = await requireSession();
  if (session.role !== 'superadmin') {
    throw new Error('Akses hanya untuk Superadmin.');
  }
}

export async function registerUnitAction(formData: FormData) {
  await requireSuperadmin();

  const unit = await registerUnit({
    name: formData.get('name'),
    prefix: formData.get('prefix'),
    email: formData.get('email'),
    password: formData.get('password'),
  });

  revalidatePath('/unit-management');
  return unit;
}
