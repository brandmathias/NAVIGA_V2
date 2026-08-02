"use client";

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { Task, TaskBoardData } from '@/types';
import { cn } from '@/lib/utils';
import { downloadTaskAttachment } from '@/lib/task-attachments.mjs';
import { plainTaskDescription } from '@/lib/task-description';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import {
  CalendarDays,
  BadgeCheck,
  CircleCheckBig,
  Download,
  EllipsisVertical,
  FileText,
  Layers3,
  ListTodo,
  LoaderCircle,
  Paperclip,
  Plus,
  Flag,
  Star,
  Trash2,
} from 'lucide-react';

type ViewMode = 'board' | 'list';

interface TaskKanbanBoardProps {
  boardData: TaskBoardData;
  setBoardData: React.Dispatch<React.SetStateAction<TaskBoardData>>;
  onTaskClick: (task: Task) => void;
  onToggleFlagged: (taskId: string) => void;
  onAddColumn: (title: string) => void;
  onDeleteColumn: (columnId: string) => void;
  newColumnTitle: string;
  onNewColumnTitleChange: (value: string) => void;
  viewMode: ViewMode;
  isReadOnlyView?: boolean;
}

const columnTones = [
  {
    accent: '#f0a900',
    soft: '#fff7e4',
    border: '#f4cc68',
    icon: 'text-[#d58f00] bg-[#fff3d4]',
  },
  {
    accent: '#2d6df6',
    soft: '#edf4ff',
    border: '#a8c4ff',
    icon: 'text-[#2d6df6] bg-[#e8f0ff]',
  },
  {
    accent: '#20b455',
    soft: '#edf9f1',
    border: '#a8dfbb',
    icon: 'text-[#1ba14b] bg-[#e3f7e9]',
  },
];

const columnIcons = [ListTodo, LoaderCircle, CircleCheckBig, Layers3];

function getTone(index: number) {
  return columnTones[index] ?? {
    accent: '#0f9f8f',
    soft: '#edf9f7',
    border: '#b8e7e0',
    icon: 'text-[#0f9f8f] bg-[#e0f7f2]',
  };
}

function getInitials(name?: string) {
  if (!name) return '-';
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function getCreatorName(task: Task) {
  return task.createdByName.trim() || task.createdBy?.trim() || 'Akun saat ini';
}

function getCreatorPhotoSrc(task: Task) {
  if (task.createdByUserId?.trim()) return `/api/users/${encodeURIComponent(task.createdByUserId.trim())}/photo`;
  return '';
}

function formatDueDate(value?: string) {
  if (!value) return 'Belum ditentukan';

  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value));
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getPriorityMeta(priority: Task['priority']) {
  if (priority === 'tinggi') return { label: 'Prioritas tinggi', className: 'bg-[#fff4f4] text-[#ff4f44]' };
  if (priority === 'rendah') return { label: 'Prioritas rendah', className: 'bg-[#fffdf0] text-[#d79e00]' };
  return { label: 'Prioritas sedang', className: 'bg-[#fff8ef] text-[#f08b00]' };
}

function renderColumnTitle(title: string) {
  const progressTitle = title.match(/^(.*?)(\s*\(In Progress\))$/i);
  if (!progressTitle) return title;

  return (
    <>
      <span className="block">{progressTitle[1]}</span>
      <span className="block">{progressTitle[2].trim()}</span>
    </>
  );
}

function TaskCard({
  task,
  index,
  columnAccent,
  isReadOnlyView,
  onTaskClick,
  onToggleFlagged,
}: {
  task: Task;
  index: number;
  columnAccent: string;
  isReadOnlyView?: boolean;
  onTaskClick: (task: Task) => void;
  onToggleFlagged: (taskId: string) => void;
}) {
  const [isDownloading, setIsDownloading] = React.useState(false);
  const shouldReduceMotion = useReducedMotion();
  const isFlagged = Boolean(task.isFlagged);
  const creatorName = getCreatorName(task);
  const priority = getPriorityMeta(task.priority);
  const primaryAttachment = task.attachments?.[0] ?? task.attachment;
  const attachmentCount = task.attachments?.length ?? (task.attachment ? 1 : 0);

  const handleDownload = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!primaryAttachment || isDownloading) return;

    setIsDownloading(true);
    try {
      await downloadTaskAttachment(primaryAttachment);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFavoriteClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onToggleFlagged(task.id);
  };

  const handleKeyboardOpen = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.target instanceof Element && event.target.closest('button')) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onTaskClick(task);
  };

  return (
    <Draggable draggableId={task.id} index={index} isDragDisabled={isReadOnlyView}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          role="button"
          tabIndex={0}
          aria-label={`Buka tugas ${task.title}, dibuat oleh ${creatorName}`}
          onClick={(event) => {
            if (event.target instanceof Element && event.target.closest('button')) return;
            onTaskClick(task);
          }}
          onKeyDown={handleKeyboardOpen}
          className="min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14b8a6] focus-visible:ring-offset-2"
        >
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 10, scale: 0.985 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.28, delay: Math.min(index * 0.045, 0.16), ease: [0.22, 1, 0.36, 1] }}
            whileHover={shouldReduceMotion ? undefined : { y: -3, transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] } }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.988, y: -1 }}
            className={cn(
              'group relative min-w-0 cursor-pointer overflow-hidden rounded-[14px] border border-[#e0eceb] bg-white p-3 shadow-[0_5px_14px_rgba(18,62,75,0.05)] transition-[border-color,box-shadow] duration-200 hover:border-[#c5e3de] hover:shadow-[0_10px_22px_rgba(18,100,102,0.09)]',
              snapshot.isDragging && 'rotate-[1deg] border-[#0f9f8f] shadow-[0_18px_40px_rgba(15,159,143,0.18)]',
            )}
            style={{ perspective: 900 }}
          >
            <span className="absolute inset-y-3 left-0 w-[3px] rounded-r-full" style={{ backgroundColor: columnAccent }} title={`Pembuat: ${creatorName}`} />
            <div className="relative flex items-start justify-between gap-2">
              <h4 className="line-clamp-2 h-[2.5rem] min-w-0 flex-1 text-[14px] font-bold leading-[1.25] text-[#173d56]">{task.title}</h4>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={isFlagged ? `Hapus penanda ${task.title}` : `Tandai ${task.title}`}
                    aria-pressed={isFlagged}
                    onClick={handleFavoriteClick}
                    onPointerDown={(event) => event.stopPropagation()}
                    onMouseDown={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                    className={cn(
                      'grid h-6 w-6 shrink-0 place-items-center rounded-full border border-transparent text-[#6e88a1] transition-[background-color,border-color,color,transform] duration-180 ease-out hover:scale-105 hover:bg-[#fff7dc] hover:text-[#e0a400] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0b429]/40 focus-visible:ring-offset-1 active:scale-95',
                      isFlagged && 'bg-[#fff4cb] text-[#df9d00]',
                    )}
                  >
                    <Star className={cn('h-4 w-4 transition-[fill,transform] duration-180', isFlagged && 'fill-current')} strokeWidth={1.8} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" align="center" sideOffset={8} collisionPadding={12} className="z-[120] whitespace-nowrap border-[#d8ece9] bg-[#12324a] text-xs font-semibold text-white shadow-[0_10px_22px_rgba(18,50,74,0.24)]">
                  {isFlagged ? 'Hapus penanda' : 'Tandai tugas ini'}
                </TooltipContent>
              </Tooltip>
            </div>

            <p className="mt-1 line-clamp-3 text-[12px] leading-[1.45] text-[#7189a1]">{plainTaskDescription(task.description) || 'Deskripsi belum tersedia.'}</p>

            <div className="mt-1.5 flex min-h-5 flex-wrap gap-1.5">
              <Badge variant="secondary" className={cn('inline-flex items-center gap-1 rounded-full border-0 px-2 py-0.5 text-[10px] font-bold', priority.className)}><Flag aria-hidden="true" className="h-3 w-3" strokeWidth={2} />{priority.label}</Badge>
            </div>

            <div className="mt-2.5 border-t border-[#eef3f2] pt-2.5">
              <div className="flex items-center justify-between gap-2 text-[11px] text-[#7089a1]">
                <span className="flex min-w-0 items-center gap-1.5 whitespace-nowrap text-[10px]">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[#5a7892]" />
                  <span>{formatDueDate(task.dueDate)}</span>
                </span>
                <div className="flex shrink-0 items-center gap-1.5">
                  {primaryAttachment ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 gap-1 rounded-full bg-[#f0faf8] px-2 text-[10px] font-bold text-[#118c80] hover:bg-[#dff5ef] hover:text-[#087b70] active:scale-95"
                      onClick={handleDownload}
                      onMouseDown={(event) => event.stopPropagation()}
                      title={`Unduh ${primaryAttachment.name} (${formatFileSize(primaryAttachment.size)})`}
                      aria-label={`Unduh lampiran ${primaryAttachment.name}`}
                      disabled={isDownloading}
                    >
                      {isDownloading ? <Download aria-hidden="true" className="h-3 w-3 animate-pulse" /> : <Paperclip aria-hidden="true" className="h-3 w-3" />}
                      <span>{attachmentCount}</span>
                    </Button>
                  ) : (
                    <span className="inline-flex h-6 items-center gap-1 rounded-full bg-[#f3f6f6] px-2 text-[10px] font-bold text-[#91a5b2]" title="Belum ada lampiran">
                      <Paperclip aria-hidden="true" className="h-3 w-3" />
                      0
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-2 flex min-w-0 items-center gap-2 text-left" title={`Pembuat: ${creatorName}`}>
                <Avatar className="h-5 w-5 shrink-0 border border-white shadow-[0_0_0_1px_rgba(15,159,143,0.14)]">
                  <AvatarImage src={getCreatorPhotoSrc(task) || undefined} alt={creatorName} />
                  <AvatarFallback className="bg-[#e7f3ff] text-[9px] font-bold text-[#2d6df6]">{getInitials(creatorName)}</AvatarFallback>
                </Avatar>
                <span className="min-w-0 truncate text-[10px] font-semibold text-[#173d56]">{creatorName}</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </Draggable>
  );
}

function TaskListView({ boardData, onTaskClick }: { boardData: TaskBoardData; onTaskClick: (task: Task) => void }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="overflow-hidden rounded-[18px] border border-[#dfeceb] bg-white shadow-[0_14px_40px_rgba(27,90,92,0.06)]">
      <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(130px,0.7fr)_minmax(130px,0.7fr)_auto] gap-4 border-b border-[#eaf1f0] bg-[#f8fcfb] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#7890a5] md:grid">
        <span>Tugas</span><span>Status</span><span>Batas waktu</span><span />
      </div>
      <div className="divide-y divide-[#edf3f2]">
        {boardData.columnOrder.flatMap((columnId, columnIndex) => {
          const column = boardData.columns[columnId];
          return column.taskIds.map((taskId) => {
            const task = boardData.tasks[taskId];
            if (!task) return null;
            const tone = getTone(columnIndex);
            return (
              <motion.button
                key={task.id}
                type="button"
                initial={shouldReduceMotion ? false : { opacity: 0, x: -8 }}
                animate={shouldReduceMotion ? undefined : { opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
                onClick={() => onTaskClick(task)}
                className="grid w-full min-w-0 gap-2 px-5 py-3.5 text-left transition-colors hover:bg-[#f5fbfa] active:bg-[#edf8f5] md:grid-cols-[minmax(0,1.5fr)_minmax(130px,0.7fr)_minmax(130px,0.7fr)_auto] md:items-center md:gap-4"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl" style={{ backgroundColor: tone.soft, color: tone.accent }}><FileText className="h-4 w-4" /></span>
                  <span className="min-w-0"><span className="block truncate text-sm font-bold text-[#173d56]">{task.title}</span><span className="mt-0.5 block truncate text-xs text-[#8195a8]">{plainTaskDescription(task.description) || 'Tanpa deskripsi'}</span></span>
                </span>
                <span className="ml-12 inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[10px] font-bold md:ml-0" style={{ backgroundColor: tone.soft, color: tone.accent }}>{column.title}</span>
                <span className="ml-12 flex items-center gap-1.5 whitespace-nowrap text-xs text-[#7089a1] md:ml-0"><CalendarDays className="h-3.5 w-3.5" />{formatDueDate(task.dueDate)}</span>
                <EllipsisVertical className="hidden h-4 w-4 text-[#9ab0bc] md:block" />
              </motion.button>
            );
          });
        })}
      </div>
    </div>
  );
}

export default function TaskKanbanBoard({
  boardData,
  setBoardData,
  onTaskClick,
  onToggleFlagged,
  onAddColumn,
  onDeleteColumn,
  newColumnTitle,
  onNewColumnTitleChange,
  viewMode,
  isReadOnlyView = false,
}: TaskKanbanBoardProps) {
  const [pendingColumnDeletion, setPendingColumnDeletion] = React.useState<{ id: string; title: string; taskCount: number } | null>(null);

  const submitNewColumn = () => {
    const title = newColumnTitle.trim();
    if (!title) {
      document.getElementById('new-column-title')?.focus();
      return;
    }
    onAddColumn(title);
  };

  const handleAddColumn = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitNewColumn();
  };

  const confirmDeleteColumn = () => {
    if (!pendingColumnDeletion) return;
    onDeleteColumn(pendingColumnDeletion.id);
    setPendingColumnDeletion(null);
  };

  const onDragEnd = (result: DropResult) => {
    if (isReadOnlyView) return;
    const { destination, source, draggableId, type } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return;

    if (type === 'column') {
      const newColumnOrder = Array.from(boardData.columnOrder);
      newColumnOrder.splice(source.index, 1);
      newColumnOrder.splice(destination.index, 0, draggableId);
      setBoardData({ ...boardData, columnOrder: newColumnOrder });
      return;
    }

    const startColumn = boardData.columns[source.droppableId];
    const finishColumn = boardData.columns[destination.droppableId];
    if (!startColumn || !finishColumn) return;

    if (startColumn === finishColumn) {
      const taskIds = Array.from(startColumn.taskIds);
      taskIds.splice(source.index, 1);
      taskIds.splice(destination.index, 0, draggableId);
      setBoardData({ ...boardData, columns: { ...boardData.columns, [startColumn.id]: { ...startColumn, taskIds } } });
      return;
    }

    const startTaskIds = Array.from(startColumn.taskIds);
    startTaskIds.splice(source.index, 1);
    const finishTaskIds = Array.from(finishColumn.taskIds);
    finishTaskIds.splice(destination.index, 0, draggableId);
    setBoardData({
      ...boardData,
      columns: {
        ...boardData.columns,
        [startColumn.id]: { ...startColumn, taskIds: startTaskIds },
        [finishColumn.id]: { ...finishColumn, taskIds: finishTaskIds },
      },
    });
  };

  if (viewMode === 'list') return <TaskListView boardData={boardData} onTaskClick={onTaskClick} />;

  return (
    <TooltipProvider delayDuration={180}>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="all-columns" direction="horizontal" type="column" isDropDisabled={isReadOnlyView}>
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="grid min-w-full auto-cols-[minmax(280px,1fr)] grid-flow-col items-stretch gap-3 overflow-x-auto rounded-[24px] border border-[#e0eeec] bg-[linear-gradient(145deg,#fbfefd,#f4faf9)] p-3 shadow-[0_16px_42px_rgba(27,90,92,0.055)]"
            >
              {boardData.columnOrder.map((columnId, index) => {
                const column = boardData.columns[columnId];
                if (!column) return null;
                const tasks = column.taskIds.map((taskId) => boardData.tasks[taskId]).filter(Boolean) as Task[];
                const tone = getTone(index);
                const ColumnIcon = columnIcons[index] ?? Layers3;
                const canDeleteColumn = !isReadOnlyView && boardData.columnOrder.length > 1;

                return (
                  <Draggable key={column.id} draggableId={column.id} index={index} isDragDisabled={isReadOnlyView}>
                    {(providedColumn, snapshot) => (
                      <div ref={providedColumn.innerRef} {...providedColumn.draggableProps} className="min-w-0">
                        <Card className={cn('flex min-h-[452px] min-w-0 flex-col overflow-hidden rounded-[14px] border bg-white/95 shadow-[0_8px_24px_rgba(18,62,75,0.045)] transition-shadow duration-200', snapshot.isDragging && 'shadow-[0_20px_44px_rgba(15,159,143,0.16)]')} style={{ borderColor: tone.border }}>
                              <div {...providedColumn.dragHandleProps} className="relative min-h-[72px] border-b border-[#eef3f2] px-3.5 py-3.5">
                                <div className="flex items-center gap-2.5">
                                  <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-xl', tone.icon)}><ColumnIcon className="h-4 w-4" strokeWidth={1.8} /></span>
                                  <h3 className="line-clamp-2 min-w-0 flex-1 whitespace-normal text-[14px] font-bold leading-5 text-[#173d56]">{renderColumnTitle(column.title)}</h3>
                              <span className="grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-[11px] font-extrabold" style={{ backgroundColor: tone.soft, color: tone.accent }}>{tasks.length}</span>
                            </div>
                          </div>

                          <Droppable droppableId={column.id} type="task" isDropDisabled={isReadOnlyView}>
                            {(providedTasks, snapshotTasks) => (
                              <div ref={providedTasks.innerRef} {...providedTasks.droppableProps} className={cn('flex flex-1 flex-col gap-2.5 p-2.5 transition-colors duration-200', snapshotTasks.isDraggingOver && 'bg-[#effaf7]')}>
                                {tasks.length > 0 ? tasks.map((task, taskIndex) => (
                                  <TaskCard
                                    key={task.id}
                                    task={task}
                                    index={taskIndex}
                                    columnAccent={tone.accent}
                                    isReadOnlyView={isReadOnlyView}
                                    onTaskClick={onTaskClick}
                                    onToggleFlagged={onToggleFlagged}
                                  />
                                )) : (
                                  <div className="flex min-h-[250px] flex-1 flex-col items-center justify-center rounded-[14px] border border-dashed border-[#dbeae7] bg-[radial-gradient(circle_at_50%_35%,#f0fbf7,transparent_55%)] px-5 text-center">
                                    <div className="task-empty-state-medallion relative mb-4 grid h-[88px] w-[88px] place-items-center">
                                      <span aria-hidden="true" className="task-empty-state-aura absolute inset-0 rounded-[28px] bg-[conic-gradient(from_220deg,#e2faf0,#8fdfbc,#f5fffa,#b6edd3,#e2faf0)] opacity-90 shadow-[0_14px_30px_rgba(30,160,104,0.14)]" />
                                      <span aria-hidden="true" className="absolute inset-[3px] rounded-[25px] border border-white/80 bg-[#f9fffc] shadow-[inset_0_0_0_1px_rgba(183,235,210,0.55)]" />
                                      <span aria-hidden="true" className="absolute inset-[11px] rounded-full border border-[#b8ebd1] bg-[radial-gradient(circle_at_35%_28%,#ffffff,#e7faf0_62%,#d2f3e2)] shadow-[0_8px_18px_rgba(24,157,98,0.12)]" />
                                      <span aria-hidden="true" className="task-empty-state-core absolute inset-[20px] grid place-items-center rounded-full bg-[linear-gradient(145deg,#35c78b,#0b9d67)] text-white shadow-[0_9px_18px_rgba(15,157,103,0.24)]">
                                        <BadgeCheck aria-hidden="true" className="relative h-9 w-9" strokeWidth={1.8} />
                                      </span>
                                      <span aria-hidden="true" className="absolute -left-0.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[#50c98f] shadow-[0_0_0_4px_rgba(80,201,143,0.1)]" />
                                      <span aria-hidden="true" className="absolute right-0 top-3 h-1.5 w-1.5 rounded-full bg-[#8ee0b7]" />
                                      <span aria-hidden="true" className="absolute bottom-0 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-[#70d5a4] shadow-[0_0_0_4px_rgba(112,213,164,0.1)]" />
                                    </div>
                                    <p className="text-sm font-bold text-[#173d56]">{index === 2 ? 'Belum ada tugas selesai' : 'Belum ada tugas'}</p>
                                    <p className="mt-1 max-w-[190px] text-xs leading-5 text-[#8197a9]">Tugas yang masuk ke kolom ini akan muncul di sini.</p>
                                  </div>
                                )}
                                {providedTasks.placeholder}
                              </div>
                            )}
                          </Droppable>
                          <div className="border-t border-[#eef3f2] px-2.5 py-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              aria-label={`Hapus kolom ${column.title}`}
                                  title={
                                    !canDeleteColumn
                                      ? 'Kolom terakhir tidak dapat dihapus'
                                      : tasks.length > 0
                                        ? 'Hapus kolom dan pindahkan tugas ke kolom tetangga'
                                        : `Hapus kolom ${column.title}`
                                  }
                                  disabled={!canDeleteColumn}
                                      onClick={() => setPendingColumnDeletion({ id: column.id, title: column.title, taskCount: tasks.length })}
                                  className="group h-8 w-full justify-center gap-1.5 rounded-lg border border-[#f2d6d8] bg-[#fff8f8] px-2 text-[10px] font-bold text-[#c66f76] shadow-[0_3px_10px_rgba(198,111,118,0.08)] transition-[background-color,border-color,box-shadow,color,transform] duration-180 ease-out hover:-translate-y-0.5 hover:border-[#e78790] hover:bg-[#ffecee] hover:text-[#b83d4b] hover:shadow-[0_8px_16px_rgba(184,61,75,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d15b64]/35 focus-visible:ring-offset-1 active:translate-y-0 active:scale-95 active:border-[#d15b64] active:bg-[#ffdfe2] active:text-[#a83b47] active:shadow-[0_2px_6px_rgba(184,61,75,0.16)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-100 disabled:border-[#f2d6d8] disabled:bg-[#fff8f8] disabled:text-[#c66f76] disabled:hover:translate-y-0 disabled:hover:border-[#f2d6d8] disabled:hover:bg-[#fff8f8] disabled:hover:text-[#c66f76] disabled:hover:shadow-none disabled:active:scale-100"
                                >
                                  <Trash2 aria-hidden="true" className="h-3.5 w-3.5 transition-transform duration-180 group-hover:scale-110 group-active:scale-95" strokeWidth={1.8} />
                              Hapus kolom
                            </Button>
                          </div>
                        </Card>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}

              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }} className="min-w-0">
                <div className="flex min-h-[448px] min-w-0 flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-[#a9e4db] bg-[radial-gradient(circle_at_50%_26%,rgba(202,244,235,0.55),transparent_42%),rgba(251,255,254,0.7)] p-5 text-center transition-[border-color,background-color] duration-200 ease-out hover:border-[#0f9f8f] hover:bg-[#f0fbf8]">
                  <button
                    type="button"
                    aria-label="Tambah kolom"
                    onClick={submitNewColumn}
                    className="group mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-[#d2eeea] bg-white text-[#0f9f8f] shadow-[0_8px_18px_rgba(15,159,143,0.1)] transition-[background-color,border-color,box-shadow,transform] duration-180 ease-out hover:-translate-y-0.5 hover:border-[#0f9f8f] hover:bg-[#effaf8] hover:shadow-[0_12px_24px_rgba(15,159,143,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f9f8f]/35 focus-visible:ring-offset-2 active:scale-95"
                  >
                    <Plus className="h-7 w-7 transition-transform duration-180 ease-out group-hover:rotate-90" strokeWidth={1.8} />
                  </button>
                  <p className="text-sm font-bold text-[#173d56]">Tambah kolom</p>
                  <p className="mt-1 max-w-[210px] text-xs leading-5 text-[#8197a9]">Buat tahap baru untuk menata alur kerja.</p>
                  <form onSubmit={handleAddColumn} className="mt-4 w-full max-w-[250px] text-left">
                    <label htmlFor="new-column-title" className="sr-only">Nama kolom baru</label>
                    <Input
                      id="new-column-title"
                      name="new-column-title"
                      value={newColumnTitle}
                      onChange={(event) => onNewColumnTitleChange(event.target.value)}
                      placeholder="Nama kolom…"
                      autoComplete="off"
                      className="h-10 w-full rounded-xl border-[#cfe8e4] bg-white text-sm text-[#173d56] shadow-none focus-visible:border-[#0f9f8f] focus-visible:ring-[#0f9f8f]/20"
                    />
                  </form>
                </div>
                  </motion.div>
                </div>
              )}
            </Droppable>
          </DragDropContext>

          <Dialog open={Boolean(pendingColumnDeletion)} onOpenChange={(open) => !open && setPendingColumnDeletion(null)}>
            <DialogContent
              hideCloseButton
              overlayClassName="bg-[#102c35]/55 backdrop-blur-[6px]"
              className="w-[calc(100vw-2rem)] max-w-[400px] overflow-hidden rounded-[20px] border border-[#e0ebe9] bg-white p-0 shadow-[0_24px_70px_rgba(14,57,61,0.24)]"
            >
              <DialogHeader className="border-b border-[#edf3f2] bg-[#fffdfd] px-5 py-4 text-left">
                <div className="flex items-center gap-2" aria-hidden="true">
                  <span className="h-1.5 w-8 rounded-full bg-[#d15b64]" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8a9da7]">Kolom tugas</span>
                </div>
                <DialogTitle className="mt-3 text-[17px] font-bold tracking-tight text-[#173d56]">Hapus kolom?</DialogTitle>
                <DialogDescription className="mt-1 text-xs leading-5 text-[#71899c]">
                  Hapus kolom <span className="font-bold text-[#173d56]">{pendingColumnDeletion?.title}</span>?
                </DialogDescription>
              </DialogHeader>

              <div className="px-5 py-3.5">
                <p className="border-l-2 border-[#e4b0b6] pl-3 text-xs leading-5 text-[#71899c]">
                  {pendingColumnDeletion?.taskCount
                    ? `Kolom berisi ${pendingColumnDeletion.taskCount} tugas.`
                    : 'Kolom ini kosong.'}
                </p>
              </div>

              <DialogFooter className="flex flex-row items-center justify-between gap-3 border-t border-[#edf3f2] bg-[#fbfdfd] px-5 py-3 sm:justify-between sm:space-x-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPendingColumnDeletion(null)}
                  className="h-9 rounded-xl border-[#d6e6e3] px-4 text-xs font-bold text-[#567086] transition-[background-color,border-color,color,transform] duration-180 ease-out hover:-translate-y-0.5 hover:border-[#b9d9d4] hover:bg-[#f0f8f6] hover:text-[#0e7d74] active:translate-y-0 active:scale-95"
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  onClick={confirmDeleteColumn}
                  disabled={!pendingColumnDeletion}
                  className="h-9 rounded-xl bg-[#e85d67] px-4 text-xs font-bold text-white shadow-[0_8px_18px_rgba(232,93,103,0.18)] transition-[background-color,box-shadow,transform] duration-180 ease-out hover:-translate-y-0.5 hover:bg-[#d94e59] hover:shadow-[0_11px_22px_rgba(217,78,89,0.22)] active:translate-y-0 active:scale-95"
                >
                  Hapus kolom
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TooltipProvider>
      );
}
