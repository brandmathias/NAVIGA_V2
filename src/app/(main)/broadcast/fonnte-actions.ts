'use server';

import { queueGadaiCustomers, queueInstallmentCustomers } from '@/lib/broadcast-queue';
import { requireSession } from '@/lib/local-auth';
import type {
  BroadcastTemplate,
  GadaiQueueCustomer,
  InstallmentQueueCustomer,
  QueueResult,
} from '@/lib/broadcast-queue';

export async function queueGadaiBroadcast({ customers, template }: {
  customers: GadaiQueueCustomer[];
  template: BroadcastTemplate;
}): Promise<QueueResult> {
  return queueGadaiCustomers({ session: await requireSession(), customers, template });
}

export async function queueInstallmentBroadcast({ customers, template }: {
  customers: InstallmentQueueCustomer[];
  template: BroadcastTemplate;
}): Promise<QueueResult> {
  return queueInstallmentCustomers({ session: await requireSession(), customers, template });
}
