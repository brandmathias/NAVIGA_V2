"use client";

import React, { useEffect, useRef, useState } from 'react';
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
import type { Task } from '@/types';
import { AlignLeft, Bold, Calendar as CalendarIcon, Download, Eye, FileText, Flag, Italic, Link2, ListOrdered, Loader2, Maximize2, Paperclip, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { downloadTaskAttachment, previewTaskAttachment } from '@/lib/task-attachments.mjs';
import { plainTaskDescription } from '@/lib/task-description';
import { cn } from '@/lib/utils';
import { TASK_PRIORITY_OPTIONS } from './task-dialog-config';
import TaskAttachmentPreview from './TaskAttachmentPreview';

interface TaskDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onUpdateTask: (updatedTask: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

type EditorCommand = 'justifyLeft' | 'insertOrderedList' | 'bold' | 'italic' | 'createLink';

const priorityOptions = TASK_PRIORITY_OPTIONS;

const editorTools: Array<{ label: string; icon: React.ElementType; command?: EditorCommand; action?: 'expand' | 'link' }> = [
  { label: 'Perbesar editor', icon: Maximize2, action: 'expand' },
  { label: 'Tautan', icon: Link2, action: 'link' },
  { label: 'Rata kiri', icon: AlignLeft, command: 'justifyLeft' },
  { label: 'Daftar bernomor', icon: ListOrdered, command: 'insertOrderedList' },
  { label: 'Tebal', icon: Bold, command: 'bold' },
  { label: 'Miring', icon: Italic, command: 'italic' },
];

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function TaskDetailsDialog({ isOpen, onClose, task, onUpdateTask, onDeleteTask }: TaskDetailsDialogProps) {
  const [currentTask, setCurrentTask] = useState<Task | null>(task);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [isEditorExpanded, setIsEditorExpanded] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const editorTaskIdRef = useRef<string | null>(null);
  const lastEditorValueRef = useRef('');

  useEffect(() => {
    const nextDescription = task?.description ?? '';
    const nextTaskId = task?.id ?? null;
    setCurrentTask(task);
    setDownloadError('');
    setIsPreviewing(false);
    setIsEditorExpanded(false);
    if (editorRef.current && (editorTaskIdRef.current !== nextTaskId || lastEditorValueRef.current !== nextDescription)) {
      editorRef.current.innerHTML = nextDescription;
      lastEditorValueRef.current = nextDescription;
    }
    editorTaskIdRef.current = nextTaskId;
  }, [task]);

  if (!currentTask) return null;

  const primaryAttachment = currentTask.attachments?.[0] ?? currentTask.attachment;
  const attachmentCount = currentTask.attachments?.length ?? (currentTask.attachment ? 1 : 0);
  const attachments = currentTask.attachments?.length
    ? currentTask.attachments
    : primaryAttachment
      ? [primaryAttachment]
      : [];

  const handleUpdate = (field: keyof Task, value: any) => {
    const updatedTask = { ...currentTask, [field]: value };
    setCurrentTask(updatedTask);
    onUpdateTask(updatedTask);
  };

  const syncEditorValue = () => {
    const nextDescription = editorRef.current?.innerHTML ?? '';
    lastEditorValueRef.current = nextDescription;
    handleUpdate('description', nextDescription);
  };

  const runEditorCommand = (command: EditorCommand, value?: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    document.execCommand(command, false, value);
    syncEditorValue();
  };

  const handleLinkCommand = () => {
    const url = window.prompt('Masukkan URL tautan');
    if (url?.trim()) runEditorCommand('createLink', url.trim());
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

  const handlePreview = async () => {
    if (!primaryAttachment || isPreviewing) return;
    setIsPreviewing(true);
    setDownloadError('');
    try {
      await previewTaskAttachment(primaryAttachment);
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : 'Pratinjau lampiran tidak dapat dibuka.');
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleDelete = () => {
    onDeleteTask(currentTask.id);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="!flex !min-h-0 max-h-[min(700px,calc(100dvh-1.5rem))] w-[calc(100vw-1.5rem)] max-w-[920px] !flex-col !gap-0 !overflow-hidden rounded-[24px] border border-[#d9e7e4] bg-white !p-0 shadow-[0_24px_80px_rgba(10,57,61,0.18)]">
        <DialogHeader className="flex shrink-0 items-center justify-between gap-3 border-b border-[#edf3f2] px-5 py-3.5">
          <DialogTitle className="inline-flex items-center rounded-full border border-[#d5ece8] bg-[#f3fbf9] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[#0e7a73] shadow-[0_4px_12px_rgba(11,117,110,0.07)]">
            Detail Tugas
          </DialogTitle>
          <DialogDescription className="sr-only">Lihat dan perbarui ringkasan tugas, tenggat, prioritas, dan lampiran.</DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 gap-2.5 overflow-y-auto px-4 py-3">
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
              className="h-8 min-h-8 relative z-[1] w-full border-0 bg-transparent p-0 text-[18px] font-semibold leading-6 tracking-[-0.02em] text-[#0f5260] shadow-none ring-0 focus-visible:ring-0"
            />
          </section>

          <section className={cn(
            'relative min-h-0 rounded-[16px] border border-[#dde8e6] bg-white px-4 py-2.5 shadow-[0_6px_16px_rgba(8,61,56,0.03)]',
            isEditorExpanded && 'fixed inset-4 z-[60] m-0 flex flex-col rounded-[20px] bg-white p-5 shadow-[0_24px_80px_rgba(10,57,61,0.22)]',
          )}>
            <Label className="mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#0f7d76]">
              <span className="h-4 w-1 rounded-full bg-[linear-gradient(180deg,#50d4c2,#0fa292)]" />
              Deskripsi
            </Label>

            <div className="relative flex flex-col overflow-hidden rounded-[14px] border border-[#d7e3e0] bg-white">
              <div className="flex shrink-0 flex-wrap items-center gap-0 border-b border-[#e8efee] bg-[#fbfdfd] px-2 py-0.5 text-[#12384e]">
                {editorTools.map(({ icon: Icon, label: itemLabel, command, action }) => (
                  <React.Fragment key={itemLabel}>
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        if (action === 'expand') setIsEditorExpanded((current) => !current);
                        else if (action === 'link') handleLinkCommand();
                        else if (command) runEditorCommand(command);
                      }}
                      className="grid h-7 w-7 place-items-center rounded-lg text-[#344b66] transition-[transform,background-color,color] duration-160 ease-out hover:bg-[#edf8f5] hover:text-[#0e7e75] active:scale-95"
                      title={itemLabel}
                      aria-label={itemLabel}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </button>
                    {itemLabel !== 'Miring' && <span className="mx-0.5 h-4 w-px bg-[#e3e9e8]" />}
                  </React.Fragment>
                ))}
              </div>

              <div className="relative min-h-0 flex-1">
                {!plainTaskDescription(currentTask.description) && <span className="pointer-events-none absolute left-3 top-2.5 z-10 text-[13px] text-[#a7b9c6]">Tambahkan deskripsi lebih detail…</span>}
                <div
                  ref={editorRef}
                  contentEditable={true}
                  suppressContentEditableWarning
                  role="textbox"
                  aria-label="Deskripsi tugas"
                  aria-multiline="true"
                  onInput={syncEditorValue}
                  className="min-h-[74px] overflow-y-auto px-3 py-2 text-[13px] leading-5 text-[#233d5a] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#12a995]/20 [&_ol]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-0.5 [&_li]:pl-1"
                />
              </div>
            </div>
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
              Prioritas
            </Label>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
              {priorityOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={currentTask.priority === option.value}
                  onClick={() => handleUpdate('priority', option.value)}
                  className={cn(
                    'group flex h-[44px] min-w-0 items-center justify-center gap-1.5 rounded-[11px] border px-2 text-[11px] font-bold transition-[transform,border-color,background-color,box-shadow,color] duration-180 ease-out active:scale-[0.98]',
                    currentTask.priority === option.value
                      ? option.selected
                      : `${option.tone} hover:-translate-y-0.5 hover:shadow-[0_8px_14px_rgba(0,0,0,0.05)]`,
                  )}
                >
                  <Flag aria-hidden="true" className="h-3.5 w-3.5 shrink-0 transition-transform duration-160 group-hover:-translate-y-0.5" />
                  <span className="truncate">{option.label}</span>
                </button>
              ))}
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
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button type="button" variant="outline" onClick={handlePreview} disabled={isPreviewing} className="h-9 gap-2 rounded-xl border-[#bde7df] bg-white px-3 text-xs font-bold text-[#0b8779] hover:bg-[#eaf9f5] active:scale-95">
                    {isPreviewing ? <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" /> : <Eye aria-hidden="true" className="h-3.5 w-3.5" />}
                    Pratinjau
                  </Button>
                  <Button type="button" variant="outline" onClick={handleDownload} disabled={isDownloading} className="h-9 gap-2 rounded-xl border-[#bde7df] bg-white px-3 text-xs font-bold text-[#0b8779] hover:bg-[#eaf9f5] active:scale-95">
                    {isDownloading ? <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" /> : <Download aria-hidden="true" className="h-3.5 w-3.5" />}
                    Unduh
                  </Button>
                </div>
              )}
            </div>
            {downloadError && <p role="alert" className="mt-3 rounded-lg bg-[#fff4f4] px-3 py-2 text-xs text-[#c54c55]">{downloadError}</p>}
            <div className="mt-2 flex items-center gap-2 rounded-[10px] border border-dashed border-[#d8e8e5] bg-[#f8fcfb] px-2.5 py-1.5 text-[11px] text-[#7b8ea0]">
              <Paperclip className="h-3.5 w-3.5 shrink-0 text-[#0e8d80]" />
              <span className="truncate">{primaryAttachment ? 'Lampiran siap diunduh' : 'Belum ada file yang dilampirkan'}</span>
            </div>
            {attachments.length > 0 && (
              <div className={cn('mt-3 grid gap-2', attachments.length > 1 ? 'sm:grid-cols-2' : 'grid-cols-1')}>
                {attachments.map((attachment) => (
                  <TaskAttachmentPreview key={attachment.id} attachment={attachment} compact={attachments.length > 1} />
                ))}
              </div>
            )}
          </section>
        </div>

        <DialogFooter className="flex shrink-0 flex-col-reverse gap-2 border-t border-[#edf3f2] bg-[#fbfdfd] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <Button variant="destructive" onClick={handleDelete} className="h-10 w-full min-w-0 gap-2 rounded-xl bg-[#f05d65] shadow-[0_8px_18px_rgba(240,93,101,0.14)] transition-[transform,background-color] duration-180 ease-out hover:-translate-y-0.5 hover:bg-[#e04f59] active:translate-y-0 sm:w-auto sm:min-w-[140px]">
            <Trash2 aria-hidden="true" className="h-4 w-4" />
            Hapus Tugas
          </Button>
          <Button onClick={onClose} className="h-10 w-full min-w-0 rounded-xl bg-[#0f9f8f] px-6 shadow-[0_8px_18px_rgba(15,159,143,0.16)] transition-[transform,background-color] duration-180 ease-out hover:-translate-y-0.5 hover:bg-[#0b8c7e] active:translate-y-0 sm:w-auto sm:min-w-[170px]">
            Simpan & Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
