import type { FonnteRecipient } from './fonnte-client';
import type { RegisteredUnit } from './unit-registry';

export type BroadcastTemplate = 'jatuh-tempo' | 'keterlambatan' | 'peringatan-lelang';
export type BroadcastSession = { role: 'superadmin' | 'unit'; unitPrefix?: string | null };
export type QueueResult = { accepted: number; reference?: string };
export type ListUnitsImpl = () => Promise<RegisteredUnit[]>;
export type QueueImpl = (input: { recipients: FonnteRecipient[] }) => Promise<QueueResult>;
export type GadaiQueueCustomer = {
  sbg_number: unknown;
  phone_number: unknown;
  name?: unknown;
  due_date?: unknown;
  barang_jaminan?: unknown;
};
export type InstallmentQueueCustomer = {
  account_number: unknown;
  phone_number: unknown;
  nasabah?: unknown;
  produk?: unknown;
  pencairan?: unknown;
  hr_tung?: unknown;
  angsuran?: unknown;
  kewajiban?: unknown;
};

export function getAllowedPrefixes(session: BroadcastSession, dependencies?: { listUnitsImpl?: ListUnitsImpl }): Promise<string[]>;
export function prepareGadaiRecipients(input: {
  session: BroadcastSession;
  customers: GadaiQueueCustomer[];
  template: BroadcastTemplate;
  listUnitsImpl?: ListUnitsImpl;
}): Promise<FonnteRecipient[]>;
export function prepareInstallmentRecipients(input: {
  session: BroadcastSession;
  customers: InstallmentQueueCustomer[];
  template: BroadcastTemplate;
  listUnitsImpl?: ListUnitsImpl;
}): Promise<FonnteRecipient[]>;
export function queueGadaiCustomers(input: {
  session: BroadcastSession;
  customers: GadaiQueueCustomer[];
  template: BroadcastTemplate;
  listUnitsImpl?: ListUnitsImpl;
  queueImpl?: QueueImpl;
}): Promise<QueueResult>;
export function queueInstallmentCustomers(input: {
  session: BroadcastSession;
  customers: InstallmentQueueCustomer[];
  template: BroadcastTemplate;
  listUnitsImpl?: ListUnitsImpl;
  queueImpl?: QueueImpl;
}): Promise<QueueResult>;
