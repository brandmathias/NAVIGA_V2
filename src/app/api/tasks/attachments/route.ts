import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth-session';
import { scopeForSession } from '@/lib/task-board-repository';
import { saveTaskAttachment } from '@/lib/task-attachment-repository';
import { MAX_TASK_ATTACHMENT_SIZE_BYTES, validateTaskAttachment } from '@/lib/task-attachments.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function errorStatus(error: unknown) {
  if (error && typeof error === 'object' && 'status' in error && typeof error.status === 'number') return error.status;
  return 500;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Lampiran belum dapat disimpan.';
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File lampiran belum dipilih.' }, { status: 400 });
    }

    const validation = validateTaskAttachment(file);
    if (!validation.valid) return NextResponse.json({ error: validation.message }, { status: 400 });
    if (file.size > MAX_TASK_ATTACHMENT_SIZE_BYTES) {
      return NextResponse.json({ error: 'Ukuran file maksimal 10 MB.' }, { status: 400 });
    }

    const content = Buffer.from(await file.arrayBuffer());
    const attachment = await saveTaskAttachment({
      id: globalThis.crypto?.randomUUID?.() ?? `attachment-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      scopeKey: scopeForSession(session),
      createdByUserId: session.userId,
      name: file.name,
      type: file.type,
      size: file.size,
      content,
    });

    return NextResponse.json({ attachment }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: errorStatus(error) });
  }
}
