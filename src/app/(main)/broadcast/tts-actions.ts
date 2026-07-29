'use server';

import { requireSession } from '@/lib/local-auth';
import { synthesizePiperWav } from '@/lib/piper-tts';

export async function generateCustomerVoicenote(input: { text: string }): Promise<{ audioDataUri: string }> {
  await requireSession();
  return { audioDataUri: await synthesizePiperWav(input.text) };
}
