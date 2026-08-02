'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { requireSession } from '@/lib/auth-session';
import { registerUnit, registerUnitAdmin, updateUnit, updateUnitAdmin } from '@/lib/naviga-directory.mjs';

async function requireSuperadmin() {
  const session = await requireSession();
  if (session.role !== 'superadmin') {
    throw new Error('Akses hanya untuk Superadmin.');
  }
}

function readList(formData: FormData, field: string) {
  const value = formData.get(field);
  if (!value) return [];
  try {
    const list = JSON.parse(String(value));
    if (!Array.isArray(list)) throw new Error('shape');
    return list;
  } catch {
    throw new Error(`Data ${field} tidak valid. Silakan tambahkan kembali.`);
  }
}

export async function registerUnitAction(formData: FormData) {
  await requireSuperadmin();

  const unit = await registerUnit({
    name: formData.get('name'),
    prefix: formData.get('prefix'),
    domicile: formData.get('domicile'),
    province: formData.get('province'),
    phone: formData.get('phone'),
    address: formData.get('address'),
    mapUrl: formData.get('mapUrl'),
    managers: readList(formData, 'managers'),
    appraisers: readList(formData, 'appraisers'),
    admins: readList(formData, 'admins'),
    adminName: formData.get('adminName'),
    adminPhone: formData.get('adminPhone'),
    email: formData.get('email'),
    password: formData.get('password'),
  }, await headers());

  revalidatePath('/unit-management');
  revalidatePath('/dashboard');
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
  }, await headers());

  revalidatePath('/unit-management');
  return admin;
}

export async function updateUnitAction(formData: FormData) {
  await requireSuperadmin();

  const unit = await updateUnit({
    id: formData.get('id'),
    name: formData.get('name'),
    prefix: formData.get('prefix'),
    domicile: formData.get('domicile'),
    province: formData.get('province'),
    phone: formData.get('phone'),
    address: formData.get('address'),
    mapUrl: formData.get('mapUrl'),
    managers: readList(formData, 'managers'),
    appraisers: readList(formData, 'appraisers'),
    admins: readList(formData, 'admins'),
  }, await headers());

  revalidatePath('/unit-management');
  revalidatePath(`/unit-management/${unit.id}`);
  revalidatePath('/dashboard');
  return unit;
}

export async function updateUnitAdminAction(formData: FormData) {
  await requireSuperadmin();

  const admin = await updateUnitAdmin({
    id: formData.get('id'),
    unitId: formData.get('unitId'),
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    password: formData.get('password'),
  }, await headers());

  revalidatePath('/unit-management');
  revalidatePath('/dashboard');
  return admin;
}

export async function deleteUnitAdminAction(input: { id: string; unitId?: string }) {
  await requireSuperadmin();

  const { deleteUnitAdmin } = await import('@/lib/naviga-directory.mjs');
  const result = await deleteUnitAdmin(input?.id);

  revalidatePath('/unit-management');
  if (input?.unitId) revalidatePath(`/unit-management/${input.unitId}`);
  revalidatePath('/dashboard');
  return result;
}
