'use server';

import { revalidatePath } from 'next/cache';
import { requireSession } from '@/lib/local-auth';
import { registerUnit, registerUnitAdmin } from '@/lib/unit-registry';

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
    domicile: formData.get('domicile'),
    phone: formData.get('phone'),
    address: formData.get('address'),
    adminName: formData.get('adminName'),
    adminPhone: formData.get('adminPhone'),
    email: formData.get('email'),
    password: formData.get('password'),
  });

  revalidatePath('/unit-management');
  return unit;
}

export async function registerUnitAdminAction(formData: FormData) {
  await requireSuperadmin();

  const admin = await registerUnitAdmin({
    unitId: formData.get('unitId'),
    name: formData.get('name'),
    domicile: formData.get('domicile'),
    phone: formData.get('phone'),
    address: formData.get('address'),
    email: formData.get('email'),
    password: formData.get('password'),
  });

  revalidatePath('/unit-management');
  return admin;
}
