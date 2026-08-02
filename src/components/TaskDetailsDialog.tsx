"use client";

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Task } from '@/types';
import { Badge } from './ui/badge';
import { Calendar as CalendarIcon, Download, FileText, Loader2, Paperclip, Tag, Trash2, User } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { downloadTaskAttachment } from '@/lib/task-attachments.mjs';

interface TaskDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onUpdateTask: (updatedTask: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

const mockAssignees = ['Admin 1', 'Admin 2', 'User A', 'User B'];

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
      <DialogContent className="max-h-[min(760px,calc(100vh-2rem))] overflow-y-auto overflow-x-hidden border-0 bg-[#fbfefd] p-0 shadow-[0_26px_90px_rgba(9,64,78,0.2)] sm:max-w-[620px]">
        <div className="relative overflow-hidden border-b border-[#dcece9] bg-[radial-gradient(circle_at_92%_0%,rgba(20,184,166,0.2),transparent_32%),linear-gradient(135deg,#effaf7,#ffffff_62%)] px-6 pb-6 pt-6">
          <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full border border-[#9ddfd5]/60" />
          <div className="pointer-events-none absolute right-7 top-5 h-24 w-24 rounded-full border border-[#9ddfd5]/35" />
          <DialogHeader className="relative">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#0f9f8f]"><span className="grid h-7 w-7 place-items-center rounded-lg bg-white/80 shadow-sm"><FileText className="h-3.5 w-3.5" /></span> Detail tugas</div>
            <DialogTitle>
              <Input
                value={currentTask.title}
                onChange={(event) => handleUpdate('title', event.target.value)}
                className="relative h-auto border-0 bg-transparent p-0 font-headline text-2xl font-extrabold tracking-[-0.03em] text-[#12324a] shadow-none focus-visible:ring-0"
              />
            </DialogTitle>
            <DialogDescription className="max-w-lg text-sm leading-6 text-[#6f879d]">Perbarui detail, penanggung jawab, dan tenggat tugas dari satu panel.</DialogDescription>
          </DialogHeader>
        </div>

        <div className="grid gap-5 px-6 py-6">
          <div className="grid gap-2">
            <Label htmlFor="task-description" className="text-xs font-bold uppercase tracking-[0.12em] text-[#648099]">Deskripsi</Label>
            <Textarea id="task-description" value={currentTask.description || ''} onChange={(event) => handleUpdate('description', event.target.value)} placeholder="Tambahkan deskripsi lebih detail..." className="min-h-[110px] resize-none rounded-2xl border-[#d9e9e7] bg-white px-4 py-3 text-[#12324a] shadow-sm focus-visible:border-[#12a995] focus-visible:ring-[#12a995]/20" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2 rounded-2xl border border-[#e0eceb] bg-white p-3.5 shadow-sm">
              <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-[#648099]"><User className="h-3.5 w-3.5 text-[#0f9f8f]" /> Penanggung jawab</Label>
              <select value={currentTask.assignee?.name || ''} onChange={(event) => handleUpdate('assignee', event.target.value ? { name: event.target.value } : undefined)} className="h-10 w-full rounded-xl border border-[#dcebe9] bg-[#fafdfe] px-3 text-sm text-[#173d56] outline-none transition-colors focus:border-[#12a995]">
                <option value="">Tidak ditugaskan</option>
                {mockAssignees.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>

            <div className="grid gap-2 rounded-2xl border border-[#e0eceb] bg-white p-3.5 shadow-sm">
              <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-[#648099]"><CalendarIcon className="h-3.5 w-3.5 text-[#0f9f8f]" /> Batas waktu</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-10 w-full justify-start rounded-xl border-[#dcebe9] bg-[#fafdfe] text-left font-normal text-[#173d56] hover:bg-[#f0faf7]">
                    <CalendarIcon className="mr-2 h-4 w-4 text-[#0f9f8f]" />
                    {currentTask.dueDate ? format(new Date(currentTask.dueDate), 'PPP') : <span className="text-[#8197a9]">Pilih tanggal</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={currentTask.dueDate ? new Date(currentTask.dueDate) : undefined} onSelect={(date) => handleUpdate('dueDate', date?.toISOString())} initialFocus /></PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid gap-2 rounded-2xl border border-[#e0eceb] bg-white p-4 shadow-sm">
            <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-[#648099]"><Tag className="h-3.5 w-3.5 text-[#0f9f8f]" /> Label</Label>
            <div className="flex min-h-7 flex-wrap gap-1.5">
              {(currentTask.labels || []).map((label) => <Badge key={label} variant="secondary" className="cursor-pointer rounded-full border-0 bg-[#e7f8f4] px-2.5 py-1 text-[10px] font-bold text-[#118c80] transition-colors hover:bg-[#d2f2eb]" onClick={() => handleRemoveLabel(label)}>{label}<span className="ml-1.5 opacity-60">×</span></Badge>)}
              {!currentTask.labels?.length && <span className="text-xs text-[#95a8b5]">Belum ada label</span>}
            </div>
            <div className="flex items-center gap-2">
              <Input value={newLabel} onChange={(event) => setNewLabel(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && handleAddLabel()} placeholder="Tambah label baru..." className="h-9 rounded-xl border-[#dcebe9] bg-[#fafdfe] text-sm" />
              <Button type="button" onClick={handleAddLabel} size="sm" className="h-9 rounded-xl bg-[#e5f7f3] px-3 text-[#0b8779] hover:bg-[#d2f2eb] active:scale-95">Tambah</Button>
            </div>
          </div>

          <div className="rounded-2xl border border-[#d9eeea] bg-[linear-gradient(135deg,#f2fbf8,#ffffff)] p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[#0f9f8f] shadow-sm"><Paperclip className="h-4 w-4" /></span>
              <div className="min-w-0 flex-1"><p className="text-sm font-bold text-[#173d56]">Lampiran tugas</p><p className="mt-0.5 truncate text-xs text-[#8197a9]">{primaryAttachment ? `${primaryAttachment.name} · ${formatFileSize(primaryAttachment.size)}${attachmentCount > 1 ? ` · ${attachmentCount} file` : ''}` : 'Belum ada file yang dilampirkan'}</p></div>
              {primaryAttachment && <Button type="button" variant="outline" onClick={handleDownload} disabled={isDownloading} className="h-9 shrink-0 gap-2 rounded-xl border-[#bde7df] bg-white px-3 text-xs font-bold text-[#0b8779] hover:bg-[#eaf9f5] active:scale-95">{isDownloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} Unduh</Button>}
              </div>
            {downloadError && <p role="alert" className="mt-3 rounded-lg bg-[#fff4f4] px-3 py-2 text-xs text-[#c54c55]">{downloadError}</p>}
          </div>
        </div>

        <DialogFooter className="flex-col-reverse gap-2 border-t border-[#e8f1f0] bg-white px-6 py-4 sm:flex-row sm:justify-between">
          <Button variant="destructive" onClick={handleDelete} className="w-full gap-2 rounded-xl bg-[#f05d65] shadow-[0_8px_18px_rgba(240,93,101,0.14)] transition-all hover:-translate-y-0.5 hover:bg-[#e04f59] active:translate-y-0 sm:w-auto"><Trash2 className="h-4 w-4" /> Hapus Tugas</Button>
          <Button onClick={onClose} className="w-full rounded-xl bg-[#0f9f8f] px-6 shadow-[0_8px_18px_rgba(15,159,143,0.16)] transition-all hover:-translate-y-0.5 hover:bg-[#0b8c7e] active:translate-y-0 sm:w-auto">Simpan & Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
