'use client';

import React, { useEffect, useState } from 'react';
import type { TaskAttachment } from '@/types';
import { getTaskAttachment } from '@/lib/task-attachments.mjs';
import { cn } from '@/lib/utils';
import { FileText, Image as ImageIcon, Loader2, Music2, Video } from 'lucide-react';

interface TaskAttachmentPreviewProps {
  attachment: TaskAttachment;
  file?: Blob;
  compact?: boolean;
  className?: string;
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getPreviewKind(type: string) {
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'audio';
  if (type === 'application/pdf') return 'pdf';
  return 'file';
}

function PreviewIcon({ kind }: { kind: ReturnType<typeof getPreviewKind> }) {
  if (kind === 'image') return <ImageIcon aria-hidden="true" className="h-4 w-4" />;
  if (kind === 'video') return <Video aria-hidden="true" className="h-4 w-4" />;
  if (kind === 'audio') return <Music2 aria-hidden="true" className="h-4 w-4" />;
  return <FileText aria-hidden="true" className="h-4 w-4" />;
}

export default function TaskAttachmentPreview({ attachment, file, compact = false, className }: TaskAttachmentPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const mimeType = attachment.type || file?.type || 'application/octet-stream';
  const previewKind = getPreviewKind(mimeType);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    setPreviewUrl(null);
    setHasError(false);
    setIsLoading(true);

    const loadAttachment = async () => {
      try {
        const storedFile = file ?? await getTaskAttachment(attachment.id);
        if (!storedFile) throw new Error('Lampiran tidak tersedia.');

        objectUrl = URL.createObjectURL(storedFile);
        if (cancelled) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
        setPreviewUrl(objectUrl);
      } catch {
        if (!cancelled) setHasError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadAttachment();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachment.id, file]);

  const mediaHeight = compact ? 'h-16 w-20 shrink-0 rounded-[9px]' : 'h-40 w-full';

  return (
    <div className={cn('overflow-hidden rounded-[12px] border border-[#dcebe8] bg-[#fbfefd] text-left shadow-[0_5px_14px_rgba(8,61,56,0.04)]', compact && 'flex items-center gap-2 p-1.5', className)}>
      <div className={cn('relative flex items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#f7fcfb,#eef9f6)]', mediaHeight)}>
        {isLoading && <Loader2 aria-label="Memuat preview lampiran" className="h-5 w-5 animate-spin text-[#0f9f8f]" />}
        {!isLoading && previewUrl && previewKind === 'image' && (
          <img src={previewUrl} alt={`Preview ${attachment.name}`} className="h-full w-full object-contain p-2" />
        )}
        {!isLoading && previewUrl && previewKind === 'video' && (
          <video controls preload="metadata" src={previewUrl} className="h-full w-full object-contain bg-[#102f35]" aria-label={`Preview ${attachment.name}`} />
        )}
        {!isLoading && previewUrl && previewKind === 'audio' && (
          <div className="flex w-full flex-col items-center gap-2 px-3">
            <Music2 aria-hidden="true" className="h-7 w-7 text-[#0f9f8f]" />
            <audio controls preload="metadata" src={previewUrl} className="h-8 w-full" aria-label={`Preview ${attachment.name}`} />
          </div>
        )}
        {!isLoading && previewUrl && previewKind === 'pdf' && (
          <iframe title={`Preview ${attachment.name}`} src={previewUrl} className="h-full w-full border-0 bg-white" />
        )}
        {!isLoading && (!previewUrl || previewKind === 'file') && (
          <div className="flex flex-col items-center gap-1.5 px-3 text-center text-[#668293]">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-[#0f9f8f] shadow-[0_5px_12px_rgba(15,159,143,0.12)]">
              <PreviewIcon kind={previewKind} />
            </span>
            <span className="text-[10px] font-semibold">{hasError ? 'Preview tidak tersedia' : 'File siap dilihat'}</span>
          </div>
        )}
      </div>
      <div className={cn('flex min-w-0 items-center gap-2', compact ? 'flex-1 px-1 py-0' : 'border-t border-[#e5efed] px-2.5 py-2')}>
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[8px] bg-[#e8f8f4] text-[#0e8d80]">
          <PreviewIcon kind={previewKind} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-bold text-[#17384a]" title={attachment.name}>{attachment.name}</p>
          <p className="truncate text-[10px] text-[#8498a5]">{formatFileSize(attachment.size)} · {mimeType.split('/')[0]}</p>
        </div>
      </div>
    </div>
  );
}
