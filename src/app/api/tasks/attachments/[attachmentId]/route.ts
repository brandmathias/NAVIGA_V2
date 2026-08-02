import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth-session';
import { scopeForSession } from '@/lib/task-board-repository';
import { deleteTaskAttachment, getTaskAttachment } from '@/lib/task-attachment-repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type AttachmentRouteContext = { params: Promise<{ attachmentId: string }> };

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Lampiran belum dapat diproses.';
}

function errorStatus(error: unknown) {
  if (error && typeof error === 'object' && 'status' in error && typeof error.status === 'number') return error.status;
  return 500;
}

function contentDisposition(filename: string, disposition: 'inline' | 'attachment') {
  return `${disposition}; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

export async function GET(request: Request, { params }: AttachmentRouteContext) {
  try {
    const session = await requireSession();
    const { attachmentId } = await params;
    const attachment = await getTaskAttachment(attachmentId, scopeForSession(session));
    if (!attachment) return NextResponse.json({ error: 'Lampiran tidak ditemukan.' }, { status: 404 });

    const disposition = new URL(request.url).searchParams.get('download') === '1' ? 'attachment' : 'inline';
    return new NextResponse(new Blob([new Uint8Array(attachment.content)]), {
      headers: {
        'Content-Type': attachment.type,
        'Content-Length': String(attachment.size),
        'Content-Disposition': contentDisposition(attachment.name, disposition),
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: errorStatus(error) });
  }
}

export async function DELETE(_request: Request, { params }: AttachmentRouteContext) {
  try {
    const session = await requireSession();
    const { attachmentId } = await params;
    const deleted = await deleteTaskAttachment(attachmentId, scopeForSession(session));
    if (!deleted) return NextResponse.json({ error: 'Lampiran tidak ditemukan.' }, { status: 404 });
    return NextResponse.json({ deleted: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: errorStatus(error) });
  }
}
