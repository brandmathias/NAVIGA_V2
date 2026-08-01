'use server';

import { requireSession } from '@/lib/local-auth';
import { synthesizePiperWav } from '@/lib/piper-tts';
import { normalizeSpeechText } from '@/lib/tts-text';

export async function generateCustomerVoicenote(input: { text: string }): Promise<{ audioDataUri: string }> {
  await requireSession();
  const speechText = normalizeSpeechText(input.text);
  if (!speechText) throw new Error('Teks pesan suara tidak boleh kosong.');
  return { audioDataUri: await synthesizePiperWav(speechText) };
}
