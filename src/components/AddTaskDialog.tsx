"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Task, TaskAttachment } from '@/types';
import { deleteTaskAttachment, saveTaskAttachment, validateTaskAttachment } from '@/lib/task-attachments.mjs';
import { cn } from '@/lib/utils';
import {
  AlignLeft,
  Bold,
  CalendarDays,
  ChevronRight,
  CloudUpload,
  FileText,
  Flag,
  Italic,
  Link2,
  ListOrdered,
  Loader2,
  Maximize2,
  Paperclip,
  TextCursorInput,
  Trash2,
  X,
} from 'lucide-react';

interface AddTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: Omit<Task, 'id'>, columnId: string) => Promise<void> | void;
  columnId: string;
}

type Priority = 'important' | 'medium' | 'low';
type RailSection = 'title' | 'description' | 'deadline' | 'priority' | 'attachments';
type EditorCommand = 'justifyLeft' | 'insertOrderedList' | 'bold' | 'italic' | 'createLink';

const priorityOptions: Array<{
  value: Priority;
  label: string;
  tone: string;
  selected: string;
}> = [
  {
    value: 'important',
    label: 'Penting',
    tone: 'border-[#ffb4b0] bg-[#fff4f4] text-[#ff4f44]',
    selected: 'border-[#ff7a72] bg-[#ffe8e7] text-[#ff4038] shadow-[0_10px_22px_rgba(255,82,74,0.14)]',
  },
  {
    value: 'medium',
    label: 'Sedang',
    tone: 'border-[#ffd39b] bg-[#fff8ef] text-[#f08b00]',
    selected: 'border-[#ffb34f] bg-[#fff1d9] text-[#f08b00] shadow-[0_10px_22px_rgba(240,139,0,0.12)]',
  },
  {
    value: 'low',
    label: 'Rendah',
    tone: 'border-[#f5e0a6] bg-[#fffdf0] text-[#d79e00]',
    selected: 'border-[#f0c65a] bg-[#fff5d8] text-[#d79e00] shadow-[0_10px_22px_rgba(215,158,0,0.12)]',
  },
];

const railSections: Array<{ id: RailSection; icon: React.ElementType; label: string }> = [
  { id: 'title', icon: FileText, label: 'Judul Tugas' },
  { id: 'description', icon: TextCursorInput, label: 'Deskripsi' },
  { id: 'deadline', icon: CalendarDays, label: 'Batas Waktu' },
  { id: 'priority', icon: Flag, label: 'Prioritas' },
  { id: 'attachments', icon: Paperclip, label: 'Lampiran Tugas' },
];

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

function formatDeadline(dateValue: string) {
  if (!dateValue) return 'Pilih tanggal';

  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return 'Pilih tanggal';

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function getDaysLeftLabel(dateValue: string) {
  if (!dateValue) return 'Tanggal belum dipilih';

  const target = new Date(`${dateValue}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (Number.isNaN(target.getTime())) return 'Tanggal belum dipilih';

  const diffDays = Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
  if (diffDays > 0) return `Sisa ${diffDays} hari`;
  if (diffDays === 0) return 'Jatuh tempo hari ini';
  return `Terlambat ${Math.abs(diffDays)} hari`;
}

function getPriorityMeta(priority: Priority) {
  return priorityOptions.find((option) => option.value === priority) ?? priorityOptions[0];
}

function duplicateSignature(file: File) {
  return `${file.name}|${file.size}|${file.type}|${file.lastModified}`;
}

export default function AddTaskDialog({ isOpen, onClose, onAddTask, columnId }: AddTaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<Priority>('important');
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditorExpanded, setIsEditorExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Partial<Record<RailSection, HTMLElement | null>>>({});
  const [activeSection, setActiveSection] = useState<RailSection>('title');

  const selectedPriority = useMemo(() => getPriorityMeta(priority), [priority]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDeadline('');
    setPriority('important');
    setFiles([]);
    setError('');
    setIsEditorExpanded(false);
    if (editorRef.current) editorRef.current.innerHTML = '';
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onClose();
  };

  const addFiles = (nextFiles: FileList | File[]) => {
    const incoming = Array.from(nextFiles);
    if (!incoming.length) return;

    for (const file of incoming) {
      const validation = validateTaskAttachment(file);
      if (!validation.valid) {
        setError(validation.message ?? 'File tidak dapat digunakan.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
    }

    const existing = new Set(files.map(duplicateSignature));
    const merged = [...files];
    for (const file of incoming) {
      const signature = duplicateSignature(file);
      if (existing.has(signature)) continue;
      existing.add(signature);
      merged.push(file);
    }

    setFiles(merged);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    addFiles(event.target.files);
  };

  const handleSubmit = async () => {
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError('');
    const savedAttachments: TaskAttachment[] = [];

    try {
      for (const file of files) {
        const attachment = await saveTaskAttachment(file);
        savedAttachments.push(attachment);
      }

      const attachment = savedAttachments[0];
      await onAddTask(
        {
          title: title.trim(),
          description: description.trim(),
          dueDate: deadline || undefined,
          labels: [selectedPriority.label],
          attachment,
          attachments: savedAttachments.length ? savedAttachments : undefined,
        },
        columnId,
      );
      resetForm();
      onClose();
    } catch (submitError) {
      await Promise.all(savedAttachments.map((attachment) => deleteTaskAttachment(attachment.id).catch(() => undefined)));
      setError(submitError instanceof Error ? submitError.message : 'Tugas gagal ditambahkan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
  };

  const syncEditorValue = () => {
    setDescription(editorRef.current?.innerHTML ?? '');
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

  const scrollToSection = (section: RailSection) => {
    sectionRefs.current[section]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    if (!isOpen || !scrollRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

        const nextSection = (visibleEntry?.target as HTMLElement | undefined)?.dataset.section as RailSection | undefined;
        if (nextSection) setActiveSection(nextSection);
      },
      {
        root: scrollRef.current,
        threshold: [0.35, 0.55, 0.75],
      },
    );

    railSections.forEach(({ id }) => {
      const section = sectionRefs.current[id];
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        hideCloseButton
        overlayClassName="bg-slate-950/35 backdrop-blur-[8px]"
        className="max-h-[min(720px,calc(100dvh-2.5rem))] w-[calc(100vw-2rem)] max-w-[960px] overflow-hidden rounded-[24px] border border-[#d9e7e4] bg-white p-0 shadow-[0_24px_80px_rgba(10,57,61,0.18)]"
      >
        <DialogDescription className="sr-only">
          Isi judul, deskripsi, batas waktu, prioritas, dan lampiran untuk menambahkan tugas baru.
        </DialogDescription>
        <div className="flex max-h-[min(720px,calc(100dvh-2.5rem))] min-h-0 flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-[#edf3f2] px-5 py-3.5">
            <DialogTitle className="inline-flex items-center rounded-full border border-[#d5ece8] bg-[#f3fbf9] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[#0e7a73] shadow-[0_4px_12px_rgba(11,117,110,0.07)]">
              Detail Tugas
            </DialogTitle>

            <DialogClose asChild>
              <button
                type="button"
                aria-label="Tutup formulir tugas"
                className="group grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#d7e6e3] bg-white text-[#0e7770] shadow-[0_7px_16px_rgba(12,105,100,0.07)] transition-[transform,background-color,border-color,box-shadow] duration-180 ease-out hover:-translate-y-0.5 hover:border-[#b7e5de] hover:bg-[#effaf8] hover:shadow-[0_12px_22px_rgba(12,105,100,0.1)] active:scale-95"
              >
                <X className="h-[18px] w-[18px] transition-transform duration-180 group-hover:rotate-90" />
              </button>
            </DialogClose>
          </div>

          <div ref={scrollRef} className="grid min-h-0 flex-1 gap-3 overflow-y-auto overflow-x-hidden px-4 py-3 md:grid-cols-[64px_minmax(0,1fr)] md:overflow-visible">
            <aside className="relative hidden rounded-[20px] border border-[#e3eeeb] bg-[linear-gradient(180deg,#f3fbf9,#ffffff)] px-2 py-2 shadow-[0_8px_20px_rgba(8,61,56,0.045)] md:grid md:grid-rows-[64px_188px_82px_82px_86px]">
              {railSections.map(({ id, icon: Icon, label }, index) => {
                const active = activeSection === id;
                return (
                  <div key={id} className="relative flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => scrollToSection(id)}
                      aria-label={`Buka bagian ${label}`}
                      className={cn(
                        'grid h-11 w-11 place-items-center rounded-[15px] border transition-[transform,background-color,border-color,box-shadow,color] duration-180 ease-out active:scale-95',
                        active
                          ? 'border-transparent bg-[linear-gradient(145deg,#3dcbbb,#118f83)] text-white shadow-[0_11px_20px_rgba(17,143,131,0.2)]'
                          : 'border-transparent bg-[#f5fbfa] text-[#0d7d75] shadow-[0_5px_12px_rgba(13,125,117,0.07)] hover:-translate-y-0.5 hover:border-[#c8e9e2] hover:bg-[#eaf8f5] hover:shadow-[0_9px_16px_rgba(13,125,117,0.1)]',
                      )}
                    >
                      <Icon className="h-[21px] w-[21px]" strokeWidth={1.8} />
                    </button>
                    {index < railSections.length - 1 && <span className="pointer-events-none absolute -bottom-0.5 h-1 w-1 rounded-full bg-[#0e7a73]/55" />}
                  </div>
                );
              })}
            </aside>

            <div className="grid min-w-0 min-h-0 grid-cols-1 gap-3 pb-0 md:grid-cols-2">
              <section
                ref={(element) => {
                  sectionRefs.current.title = element;
                }}
                data-section="title"
                className="relative col-span-1 overflow-hidden rounded-[16px] border border-[#d9e9e7] bg-[linear-gradient(90deg,#ffffff_0%,#fbfffe_70%,#f0fbf8_100%)] px-4 py-3 shadow-[0_6px_16px_rgba(8,61,56,0.035)] before:absolute before:inset-y-0 before:left-0 before:w-1.5 before:rounded-l-[16px] before:bg-[linear-gradient(180deg,#52d5c4,#10978b)] md:col-span-2"
              >
                <div className="pointer-events-none absolute right-4 top-3 grid grid-cols-8 gap-1 opacity-55">
                  {Array.from({ length: 24 }).map((_, index) => (
                    <span key={index} className="h-1.5 w-1.5 rounded-full bg-[#b4e9df]" />
                  ))}
                </div>
                <Label htmlFor="task-title" className="mb-1 block text-[10px] font-bold uppercase tracking-[0.1em] text-[#0f7d76]">
                  Judul Tugas
                </Label>
                <Input
                  id="task-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Analisis data penjualan Q2"
                  className="h-auto border-0 bg-transparent p-0 text-[19px] font-semibold tracking-[-0.02em] text-[#0f5260] shadow-none ring-0 placeholder:text-[#a8b9c3] focus-visible:ring-0"
                  autoFocus
                />
              </section>

              <section
                ref={(element) => {
                  sectionRefs.current.description = element;
                }}
                data-section="description"
                className={cn(
                  'relative col-span-1 min-h-0 rounded-[16px] border border-[#dde8e6] bg-white px-4 py-3 shadow-[0_6px_16px_rgba(8,61,56,0.03)] md:col-span-2',
                  isEditorExpanded && 'fixed inset-4 z-[60] m-0 flex flex-col rounded-[20px] bg-white p-5 shadow-[0_24px_80px_rgba(10,57,61,0.22)]',
                )}
              >
                <Label className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#0f7d76]">
                  <span className="h-4 w-1 rounded-full bg-[linear-gradient(180deg,#50d4c2,#0fa292)]" />
                  Deskripsi
                </Label>

                <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[14px] border border-[#d7e3e0] bg-white">
                  <div className="flex shrink-0 flex-wrap items-center gap-0 border-b border-[#e8efee] bg-[#fbfdfd] px-2 py-1 text-[#12384e]">
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
                          className="grid h-8 w-8 place-items-center rounded-lg text-[#344b66] transition-[transform,background-color,color] duration-160 ease-out hover:-translate-y-0.5 hover:bg-[#edf8f5] hover:text-[#0e7e75] active:scale-95"
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
                    {!description && <span className="pointer-events-none absolute left-3 top-3 z-10 text-[13px] text-[#a7b9c6]">Rangkum konteks tugas di sini...</span>}
                    <div
                      ref={editorRef}
                      contentEditable={true}
                      suppressContentEditableWarning
                      role="textbox"
                      aria-label="Deskripsi tugas"
                      aria-multiline="true"
                      onInput={syncEditorValue}
                      className="h-full min-h-[124px] overflow-y-auto px-3 py-2.5 text-[13px] leading-6 text-[#233d5a] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#12a995]/20"
                    />
                  </div>
                </div>
              </section>

              <section
                ref={(element) => {
                  sectionRefs.current.deadline = element;
                }}
                data-section="deadline"
                className="col-span-1 rounded-[16px] border border-[#dde8e6] bg-white px-4 py-3 shadow-[0_6px_16px_rgba(8,61,56,0.03)]"
              >
                <Label className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#0f7d76]">
                  <span className="h-4 w-1 rounded-full bg-[linear-gradient(180deg,#50d4c2,#0fa292)]" />
                  Batas Waktu
                </Label>

                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex h-[48px] w-full items-stretch overflow-hidden rounded-[12px] border border-[#cfe2de] bg-[#f8fcfb] text-left transition-[transform,border-color,box-shadow,background-color] duration-180 ease-out hover:-translate-y-0.5 hover:border-[#99d8ce] hover:bg-[#f2fbf8] hover:shadow-[0_9px_16px_rgba(15,159,143,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12a995]/25"
                    >
                      <span className="grid min-w-0 flex-1 items-center px-3">
                        <span className="truncate text-[13px] font-semibold text-[#17384a]">{deadline ? formatDeadline(deadline) : 'Pilih tanggal'}</span>
                        <span className="truncate text-[11px] text-[#6f8495]">{getDaysLeftLabel(deadline)}</span>
                      </span>
                      <span className="grid w-11 place-items-center border-l border-[#d9e7e3] bg-[#f0faf8] text-[#0e8d80]"><CalendarDays className="h-4 w-4" /></span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto border-[#d8e7e4] bg-white p-2 shadow-[0_14px_28px_rgba(9,64,78,0.13)]">
                    <Calendar
                      mode="single"
                      selected={deadline ? new Date(`${deadline}T00:00:00`) : undefined}
                      onSelect={(date) => setDeadline(date ? date.toISOString().slice(0, 10) : '')}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </section>

              <section
                ref={(element) => {
                  sectionRefs.current.priority = element;
                }}
                data-section="priority"
                className="col-span-1 rounded-[16px] border border-[#dde8e6] bg-white px-4 py-3 shadow-[0_6px_16px_rgba(8,61,56,0.03)]"
              >
                <Label className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#0f7d76]">
                  <span className="h-4 w-1 rounded-full bg-[linear-gradient(180deg,#50d4c2,#0fa292)]" />
                  Prioritas
                </Label>

                <div className="grid grid-cols-3 gap-1.5">
                  {priorityOptions.map((option) => {
                    const active = option.value === priority;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setPriority(option.value)}
                        className={cn(
                          'group flex h-[48px] min-w-0 items-center justify-center gap-1 rounded-[11px] border px-1.5 text-[11px] font-bold transition-[transform,border-color,background-color,box-shadow,color] duration-180 ease-out active:scale-[0.98]',
                          active
                            ? option.selected
                            : `${option.tone} hover:-translate-y-0.5 hover:shadow-[0_8px_14px_rgba(0,0,0,0.05)]`,
                        )}
                      >
                        <Flag className="h-3.5 w-3.5 shrink-0 transition-transform duration-160 group-hover:-translate-y-0.5" />
                        <span className="truncate">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section
                ref={(element) => {
                  sectionRefs.current.attachments = element;
                }}
                data-section="attachments"
                className="col-span-1 rounded-[16px] border border-[#dde8e6] bg-white px-4 py-3 shadow-[0_6px_16px_rgba(8,61,56,0.03)] md:col-span-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Label className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#0f7d76]">
                      <span className="h-4 w-1 rounded-full bg-[linear-gradient(180deg,#50d4c2,#0fa292)]" />
                      Lampiran Tugas
                    </Label>
                    <p className="truncate text-[11px] text-[#6d8294]">{files.length ? `${files.length} file siap dilampirkan.` : 'Belum ada file yang dilampirkan'} <span className="text-[#9aaab6]">· Maksimal 10 MB per file</span></p>
                  </div>

                  <label
                    htmlFor="task-attachment"
                    className="inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-[11px] border border-[#abd9d3] bg-[linear-gradient(135deg,#fff,#edf9f6)] px-3 text-[11px] font-bold text-[#0d6f68] shadow-[0_6px_14px_rgba(10,101,93,0.05)] transition-[transform,background-color,border-color,box-shadow,color] duration-180 ease-out hover:-translate-y-0.5 hover:border-[#0c8d81] hover:bg-[#e5f8f3] hover:shadow-[0_10px_18px_rgba(15,159,143,0.1)] active:scale-[0.98]"
                  >
                    <CloudUpload className="h-3.5 w-3.5" />
                    Upload File
                  </label>
                  <input ref={fileInputRef} id="task-attachment" type="file" multiple className="sr-only" onChange={handleFileChange} />
                </div>

                <div className="mt-2 max-h-9 space-y-1 overflow-y-auto">
                  {files.length > 0 ? files.map((file, index) => (
                    <div key={duplicateSignature(file)} className="flex min-h-8 items-center gap-2 rounded-[10px] border border-[#e1ece9] bg-[#fbfdfd] px-2.5 py-1.5 text-left">
                      <Paperclip className="h-3.5 w-3.5 shrink-0 text-[#0e8d80]" />
                      <p className="min-w-0 flex-1 truncate text-[11px] font-semibold text-[#17384a]">{file.name} <span className="font-normal text-[#8a9cac]">· {formatFileSize(file.size)}</span></p>
                      <button type="button" className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[#7790a0] transition-[transform,background-color,color] duration-160 hover:bg-[#eef8f6] hover:text-[#0e8d80] active:scale-95" onClick={() => handleRemoveFile(index)} aria-label={`Hapus ${file.name}`}><Trash2 className="h-3 w-3" /></button>
                    </div>
                  )) : <div className="min-h-8 rounded-[10px] border border-dashed border-[#d8e8e5] bg-[#f8fcfb] px-2.5 py-1.5 text-[11px] text-[#7b8ea0]">Belum ada file yang dilampirkan</div>}
                </div>
              </section>

              {error && <p role="alert" className="col-span-1 rounded-[10px] border border-[#f3c1c1] bg-[#fff4f4] px-3 py-2 text-xs text-[#c14c54] md:col-span-2">{error}</p>}
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between gap-3 border-t border-[#edf3f2] bg-[#fbfdfd] px-5 py-3">
            <Button variant="outline" onClick={handleClose} disabled={isSubmitting} className="h-9 rounded-[11px] border-[#d6e6e3] px-4 text-xs text-[#4d6478] transition-[transform,background-color,border-color,color] duration-160 ease-out hover:-translate-y-0.5 hover:bg-[#f0f8f6] hover:text-[#0e7d74] active:scale-95">Batal</Button>
            <Button onClick={handleSubmit} disabled={!title.trim() || isSubmitting} className="h-9 rounded-[11px] bg-[linear-gradient(135deg,#13b3a1,#0e9486)] px-4 text-xs font-bold text-white shadow-[0_9px_18px_rgba(15,159,143,0.18)] transition-[transform,box-shadow,background-color] duration-160 ease-out hover:-translate-y-0.5 hover:shadow-[0_13px_24px_rgba(15,159,143,0.22)] active:translate-y-0 active:scale-[0.98]">
              {isSubmitting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              {isSubmitting ? 'Menyimpan...' : 'Tambah Tugas'}
              {!isSubmitting && <ChevronRight className="ml-1 h-3.5 w-3.5" />}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
