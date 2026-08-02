"use client";

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Task } from '@/types';
import { Badge } from './ui/badge';
import { Calendar as CalendarIcon, Download, FileText, Loader2, Paperclip, Tag, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { downloadTaskAttachment } from '@/lib/task-attachments.mjs';
import { plainTaskDescription } from '@/lib/task-description';

interface TaskDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onUpdateTask: (updatedTask: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function TaskDetailsDialog({ isOpen, onClose, task, onUpdateTask, onDeleteTask }: TaskDetailsDialogProps) {
  const [currentTask, setCurrentTask] = useState<Task | null>(task);
  const [newLabel, setNewLabel] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  useEffect(() => {
    setCurrentTask(task);
    setDownloadError('');
  }, [task]);

  if (!currentTask) return null;

  const primaryAttachment = currentTask.attachments?.[0] ?? currentTask.attachment;
  const attachmentCount = currentTask.attachments?.length ?? (currentTask.attachment ? 1 : 0);

  const handleUpdate = (field: keyof Task, value: any) => {
    const updatedTask = { ...currentTask, [field]: value };
    setCurrentTask(updatedTask);
    onUpdateTask(updatedTask);
  };

  const handleAddLabel = () => {
    const label = newLabel.trim();
    if (!label || currentTask.labels?.includes(label)) return;
    handleUpdate('labels', [...(currentTask.labels || []), label]);
    setNewLabel('');
  };

  const handleRemoveLabel = (labelToRemove: string) => {
    handleUpdate('labels', (currentTask.labels || []).filter((label) => label !== labelToRemove));
  };

  const handleDownload = async () => {
    if (!primaryAttachment || isDownloading) return;
    setIsDownloading(true);
    setDownloadError('');
    try {
      await downloadTaskAttachment(primaryAttachment);
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : 'Lampiran tidak dapat diunduh.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = () => {
    onDeleteTask(currentTask.id);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[min(700px,calc(100dvh-1.5rem))] w-[calc(100vw-1.5rem)] max-w-[920px] overflow-hidden rounded-[24px] border border-[#d9e7e4] bg-white p-0 shadow-[0_24px_80px_rgba(10,57,61,0.18)]">
        <DialogHeader className="flex items-center justify-between gap-3 border-b border-[#edf3f2] px-5 py-3.5">
          <DialogTitle className="inline-flex items-center rounded-full border border-[#d5ece8] bg-[#f3fbf9] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[#0e7a73] shadow-[0_4px_12px_rgba(11,117,110,0.07)]">
            Detail Tugas
          </DialogTitle>
          <DialogDescription className="sr-only">Lihat dan perbarui ringkasan tugas, tenggat, label, dan lampiran.</DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[min(700px,calc(100dvh-1.5rem))] gap-2.5 overflow-y-auto px-4 py-3">
          <section className="relative overflow-hidden rounded-[16px] border border-[#d9e9e7] bg-[linear-gradient(90deg,#ffffff_0%,#fbfffe_70%,#f0fbf8_100%)] px-4 py-3 shadow-[0_6px_16px_rgba(8,61,56,0.035)] before:absolute before:inset-y-0 before:left-0 before:w-1.5 before:rounded-l-[16px] before:bg-[linear-gradient(180deg,#52d5c4,#10978b)]">
            <div className="pointer-events-none absolute right-4 top-3 grid grid-cols-8 gap-1 opacity-55">
              {Array.from({ length: 24 }).map((_, index) => (
                <span key={index} className="h-1.5 w-1.5 rounded-full bg-[#b4e9df]" />
              ))}
            </div>
            <Label htmlFor="detail-title" className="mb-1 block text-[10px] font-bold uppercase tracking-[0.1em] text-[#0f7d76]">
              Judul Tugas
            </Label>
            <Input
              id="detail-title"
              value={currentTask.title}
              onChange={(event) => handleUpdate('title', event.target.value)}
              className="h-auto border-0 bg-transparent p-0 text-[18px] font-semibold tracking-[-0.02em] text-[#0f5260] shadow-none ring-0 focus-visible:ring-0"
            />
          </section>

          <section className="rounded-[16px] border border-[#dde8e6] bg-white px-4 py-3 shadow-[0_6px_16px_rgba(8,61,56,0.03)]">
            <Label htmlFor="detail-description" className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#0f7d76]">
              <span className="h-4 w-1 rounded-full bg-[linear-gradient(180deg,#50d4c2,#0fa292)]" />
              Deskripsi
            </Label>
            <Textarea
              id="detail-description"
              value={plainTaskDescription(currentTask.description)}
              onChange={(event) => handleUpdate('description', event.target.value)}
              placeholder="Tambahkan deskripsi lebih detail..."
              className="min-h-[108px] resize-none rounded-[14px] border-[#d7e3e0] bg-white px-3 py-2.5 text-[13px] leading-6 text-[#233d5a] shadow-none focus-visible:border-[#12a995] focus-visible:ring-[#12a995]/20"
            />
          </section>

          <section className="grid gap-2 rounded-[16px] border border-[#dde8e6] bg-white px-4 py-3 shadow-[0_6px_16px_rgba(8,61,56,0.03)]">
            <Label className="mb-0 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#0f7d76]">
              <span className="h-4 w-1 rounded-full bg-[linear-gradient(180deg,#50d4c2,#0fa292)]" />
              Batas Waktu
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex h-[46px] w-full justify-start rounded-[12px] border-[#cfe2de] bg-[#f8fcfb] text-left font-normal text-[#173d56] hover:bg-[#f2fbf8]">
                  <CalendarIcon className="mr-2 h-4 w-4 text-[#0f9f8f]" />
                  {currentTask.dueDate ? format(new Date(currentTask.dueDate), 'PPP') : <span className="text-[#8197a9]">Pilih tanggal</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto border-[#d8e7e4] bg-white p-2 shadow-[0_14px_28px_rgba(9,64,78,0.13)]">
                <Calendar mode="single" selected={currentTask.dueDate ? new Date(currentTask.dueDate) : undefined} onSelect={(date) => handleUpdate('dueDate', date?.toISOString())} initialFocus />
              </PopoverContent>
            </Popover>
          </section>

          <section className="grid gap-2 rounded-[16px] border border-[#dde8e6] bg-white px-4 py-3 shadow-[0_6px_16px_rgba(8,61,56,0.03)]">
            <Label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#0f7d76]">
              <span className="h-4 w-1 rounded-full bg-[linear-gradient(180deg,#50d4c2,#0fa292)]" />
              Label
            </Label>
            <div className="flex min-h-7 flex-wrap gap-1.5">
              {(currentTask.labels || []).map((label) => (
                <Badge key={label} variant="secondary" className="cursor-pointer rounded-full border-0 bg-[#e7f8f4] px-2.5 py-1 text-[10px] font-bold text-[#118c80] transition-colors hover:bg-[#d2f2eb]" onClick={() => handleRemoveLabel(label)}>
                  {label}
                  <span className="ml-1.5 opacity-60">×</span>
                </Badge>
              ))}
              {!currentTask.labels?.length && <span className="text-xs text-[#95a8b5]">Belum ada label</span>}
            </div>
            <div className="flex items-center gap-2">
              <Input value={newLabel} onChange={(event) => setNewLabel(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && handleAddLabel()} placeholder="Tambah label baru..." className="h-9 rounded-xl border-[#dcebe9] bg-[#fafdfe] text-sm" />
              <Button type="button" onClick={handleAddLabel} size="sm" className="h-9 rounded-xl bg-[#e5f7f3] px-3 text-[#0b8779] hover:bg-[#d2f2eb] active:scale-95">Tambah</Button>
            </div>
          </section>

          <section className="rounded-[16px] border border-[#dde8e6] bg-white px-4 py-3 shadow-[0_6px_16px_rgba(8,61,56,0.03)]">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <Label className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#0f7d76]">
                  <span className="h-4 w-1 rounded-full bg-[linear-gradient(180deg,#50d4c2,#0fa292)]" />
                  Lampiran Tugas
                </Label>
                <p className="truncate text-[11px] text-[#6d8294]">{primaryAttachment ? `${primaryAttachment.name} · ${formatFileSize(primaryAttachment.size)}${attachmentCount > 1 ? ` · ${attachmentCount} file` : ''}` : 'Belum ada file yang dilampirkan'}</p>
              </div>
              {primaryAttachment && (
                <Button type="button" variant="outline" onClick={handleDownload} disabled={isDownloading} className="h-9 shrink-0 gap-2 rounded-xl border-[#bde7df] bg-white px-3 text-xs font-bold text-[#0b8779] hover:bg-[#eaf9f5] active:scale-95">
                  {isDownloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  Unduh
                </Button>
              )}
            </div>
            {downloadError && <p role="alert" className="mt-3 rounded-lg bg-[#fff4f4] px-3 py-2 text-xs text-[#c54c55]">{downloadError}</p>}
            <div className="mt-2 flex items-center gap-2 rounded-[10px] border border-dashed border-[#d8e8e5] bg-[#f8fcfb] px-2.5 py-1.5 text-[11px] text-[#7b8ea0]">
              <Paperclip className="h-3.5 w-3.5 shrink-0 text-[#0e8d80]" />
              <span className="truncate">{primaryAttachment ? 'Lampiran siap diunduh' : 'Belum ada file yang dilampirkan'}</span>
            </div>
          </section>
        </div>

        <DialogFooter className="flex-col-reverse gap-2 border-t border-[#edf3f2] bg-[#fbfdfd] px-5 py-3 sm:flex-row sm:justify-between">
          <Button variant="destructive" onClick={handleDelete} className="w-full gap-2 rounded-xl bg-[#f05d65] shadow-[0_8px_18px_rgba(240,93,101,0.14)] transition-all hover:-translate-y-0.5 hover:bg-[#e04f59] active:translate-y-0 sm:w-auto">
            <Trash2 className="h-4 w-4" />
            Hapus Tugas
          </Button>
          <Button onClick={onClose} className="w-full rounded-xl bg-[#0f9f8f] px-6 shadow-[0_8px_18px_rgba(15,159,143,0.16)] transition-all hover:-translate-y-0.5 hover:bg-[#0b8c7e] active:translate-y-0 sm:w-auto">
            Simpan & Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
