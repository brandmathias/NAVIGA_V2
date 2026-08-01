"use client";

import React, { useRef, useState } from 'react';
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
import type { Task, TaskAttachment } from '@/types';
import { deleteTaskAttachment, saveTaskAttachment, validateTaskAttachment } from '@/lib/task-attachments.mjs';
import { FileUp, Loader2, Paperclip, X } from 'lucide-react';

interface AddTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: Omit<Task, 'id'>, columnId: string) => Promise<void> | void;
  columnId: string;
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AddTaskDialog({ isOpen, onClose, onAddTask, columnId }: AddTaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setFile(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    if (!nextFile) return;

    const validation = validateTaskAttachment(nextFile);
    if (!validation.valid) {
      setFile(null);
      setError(validation.message ?? 'File tidak dapat digunakan.');
      event.target.value = '';
      return;
    }

    setError('');
    setFile(nextFile);
  };

  const handleSubmit = async () => {
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError('');
    let attachment: TaskAttachment | undefined;

    try {
      if (file) attachment = await saveTaskAttachment(file);
      await onAddTask({ title: title.trim(), description: description.trim(), attachment }, columnId);
      resetForm();
      onClose();
    } catch (submitError) {
      if (attachment) await deleteTaskAttachment(attachment.id).catch(() => undefined);
      setError(submitError instanceof Error ? submitError.message : 'Tugas gagal ditambahkan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="overflow-hidden border-0 bg-white p-0 shadow-[0_24px_80px_rgba(9,64,78,0.18)] sm:max-w-[560px]">
        <div className="relative overflow-hidden border-b border-[#dcece9] bg-[radial-gradient(circle_at_85%_0%,rgba(20,184,166,0.16),transparent_34%),linear-gradient(135deg,#f4fbfa,#ffffff_58%)] px-6 pb-5 pt-6">
          <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full border border-[#9ddfd5]/60" />
          <div className="pointer-events-none absolute -right-5 -top-10 h-28 w-28 rounded-full border border-[#9ddfd5]/40" />
          <DialogHeader className="relative">
            <DialogTitle className="font-headline text-xl text-[#12324a]">Tambah tugas baru</DialogTitle>
            <DialogDescription className="max-w-md text-sm text-[#6f879d]">
              Buat pekerjaan, tambahkan konteks, lalu simpan lampiran yang perlu dibawa bersama tugas.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="grid gap-5 px-6 py-6">
          <div className="grid gap-2">
            <Label htmlFor="title" className="text-xs font-bold uppercase tracking-[0.12em] text-[#648099]">Judul tugas</Label>
            <Input
              id="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Contoh: Buat laporan mingguan"
              className="h-11 rounded-xl border-[#d9e9e7] bg-[#fbfefd] px-4 text-[#12324a] shadow-sm transition-all focus-visible:border-[#12a995] focus-visible:ring-[#12a995]/20"
              autoFocus
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description" className="text-xs font-bold uppercase tracking-[0.12em] text-[#648099]">Deskripsi</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Detail atau catatan tambahan untuk tugas ini."
              className="min-h-[104px] resize-none rounded-xl border-[#d9e9e7] bg-[#fbfefd] px-4 py-3 text-[#12324a] shadow-sm transition-all focus-visible:border-[#12a995] focus-visible:ring-[#12a995]/20"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="task-attachment" className="text-xs font-bold uppercase tracking-[0.12em] text-[#648099]">Lampiran</Label>
            <div className="rounded-2xl border border-dashed border-[#9edfd6] bg-[#f4fbfa] p-3 transition-colors hover:border-[#0fa391] hover:bg-[#eefaf7]">
              <input ref={fileInputRef} id="task-attachment" type="file" className="sr-only" onChange={handleFileChange} />
              {file ? (
                <div className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 shadow-sm">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#dff6f0] text-[#0f9485]"><Paperclip className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#12324a]">{file.name}</p>
                    <p className="text-xs text-[#7890a5]">{formatFileSize(file.size)} · siap disimpan</p>
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[#7290a1] hover:bg-[#e9f7f4] hover:text-[#0f9485]" onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} aria-label="Hapus lampiran">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label htmlFor="task-attachment" className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[#0f9485] shadow-sm"><FileUp className="h-5 w-5" /></span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[#12324a]">Pilih file apa pun</span>
                    <span className="block text-xs text-[#7890a5]">Semua format diperbolehkan · maksimal 10 MB</span>
                  </span>
                </label>
              )}
            </div>
          </div>

          {error && <p role="alert" className="rounded-xl border border-[#f5c4c4] bg-[#fff3f3] px-3 py-2 text-sm text-[#c54c55]">{error}</p>}
        </div>

        <DialogFooter className="border-t border-[#edf3f2] bg-[#fbfdfd] px-6 py-4">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting} className="rounded-xl border-[#d7e7e5] text-[#49667d] hover:bg-[#f0f8f6]">Batal</Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || isSubmitting} className="rounded-xl bg-[#0f9f8f] px-5 text-white shadow-[0_10px_24px_rgba(15,159,143,0.2)] transition-all hover:-translate-y-0.5 hover:bg-[#0c8d7f] active:translate-y-0">
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Menyimpan...' : 'Tambah Tugas'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
