"use client";

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { Task, Column, TaskBoardData } from '@/types';
import { cn } from '@/lib/utils';
import { deleteTaskAttachment, downloadTaskAttachment } from '@/lib/task-attachments.mjs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  CalendarDays,
  Check,
  CircleCheckBig,
  CircleDot,
  Download,
  EllipsisVertical,
  FileText,
  Layers3,
  ListTodo,
  LoaderCircle,
  Paperclip,
  Plus,
  Star,
} from 'lucide-react';

type ViewMode = 'board' | 'list';

interface TaskKanbanBoardProps {
  boardData: TaskBoardData;
  setBoardData: React.Dispatch<React.SetStateAction<TaskBoardData>>;
  onTaskClick: (task: Task) => void;
  onAddTask: (columnId: string) => void;
  viewMode: ViewMode;
}

const columnTones = [
  {
    accent: '#f0a900',
    soft: '#fff7e4',
    border: '#f5d58b',
    progress: 0,
    icon: 'text-[#d58f00] bg-[#fff3d4]',
  },
  {
    accent: '#2d6df6',
    soft: '#edf4ff',
    border: '#b9d0ff',
    progress: 40,
    icon: 'text-[#2d6df6] bg-[#e8f0ff]',
  },
  {
    accent: '#20b455',
    soft: '#edf9f1',
    border: '#bce8ca',
    progress: 100,
    icon: 'text-[#1ba14b] bg-[#e3f7e9]',
  },
];

const columnIcons = [ListTodo, LoaderCircle, CircleCheckBig, Layers3];

function getTone(index: number) {
  return columnTones[index] ?? {
    accent: '#0f9f8f',
    soft: '#edf9f7',
    border: '#b8e7e0',
    progress: 0,
    icon: 'text-[#0f9f8f] bg-[#e0f7f2]',
  };
}

function getInitials(name?: string) {
  if (!name) return '—';
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatDueDate(value?: string) {
  if (!value) return 'Belum ditentukan';

  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function TaskCard({ task, index, onTaskClick }: { task: Task; index: number; onTaskClick: (task: Task) => void }) {
  const [isDownloading, setIsDownloading] = React.useState(false);
  const shouldReduceMotion = useReducedMotion();

  const handleDownload = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!task.attachment || isDownloading) return;

    setIsDownloading(true);
    try {
      await downloadTaskAttachment(task.attachment);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onTaskClick(task)}
          className="min-w-0"
        >
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 14, scale: 0.98 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.38, delay: Math.min(index * 0.055, 0.2), ease: [0.22, 1, 0.36, 1] }}
            whileHover={shouldReduceMotion ? undefined : { y: -4, rotateX: 1.2, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.985, y: -1 }}
            className={cn(
              'group relative min-w-0 cursor-pointer overflow-hidden rounded-[18px] border border-[#e0eceb] bg-white p-3.5 shadow-[0_5px_16px_rgba(18,62,75,0.055)] transition-shadow duration-200 hover:border-[#b6dfd8] hover:shadow-[0_14px_28px_rgba(18,100,102,0.12)]',
              snapshot.isDragging && 'rotate-[1deg] border-[#0f9f8f] shadow-[0_18px_40px_rgba(15,159,143,0.2)]',
            )}
            style={{ perspective: 900 }}
          >
            <div className="pointer-events-none absolute -right-8 -top-9 h-20 w-20 rounded-full border border-[#d7f0ec] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative flex items-start justify-between gap-2">
              <h4 className="min-w-0 flex-1 text-[14px] font-bold leading-[1.25] text-[#173d56]">{task.title}</h4>
              <Star className="mt-0.5 h-4 w-4 shrink-0 text-[#6e88a1] transition-all duration-200 group-hover:fill-[#f6c451] group-hover:text-[#e6a800]" />
            </div>
            {task.description && <p className="mt-2 line-clamp-2 text-[12px] leading-[1.5] text-[#7189a1]">{task.description}</p>}

            <div className="mt-3 flex min-h-5 flex-wrap gap-1.5">
              {task.labels?.map((label, labelIndex) => (
                <Badge key={label} variant="secondary" className={cn(
                  'rounded-full border-0 px-2 py-0.5 text-[10px] font-bold',
                  labelIndex === 0 ? 'bg-[#fff0ef] text-[#ea6262]' : 'bg-[#e6f8f5] text-[#118c80]',
                )}>{label}</Badge>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#eef3f2] pt-3 text-[11px] text-[#7089a1]">
              <span className="flex min-w-0 items-center gap-1.5 truncate"><CalendarDays className="h-3.5 w-3.5 shrink-0 text-[#5a7892]" />{formatDueDate(task.dueDate)}</span>
              <div className="flex shrink-0 items-center gap-1.5">
                {task.attachment && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 max-w-[112px] gap-1 rounded-full bg-[#f0faf8] px-2 text-[10px] font-semibold text-[#118c80] hover:bg-[#dff5ef] hover:text-[#087b70] active:scale-95"
                    onClick={handleDownload}
                    title={`Unduh ${task.attachment.name}`}
                  >
                    {isDownloading ? <Download className="h-3 w-3 animate-pulse" /> : <Paperclip className="h-3 w-3" />}
                    <span className="truncate">{formatFileSize(task.attachment.size)}</span>
                  </Button>
                )}
                {task.assignee ? (
                  <Avatar className="h-7 w-7 border-2 border-white shadow-sm">
                    <AvatarImage src={task.assignee.avatar} alt="" />
                    <AvatarFallback className="bg-[#e7f3ff] text-[10px] font-bold text-[#2d6df6]">{getInitials(task.assignee.name)}</AvatarFallback>
                  </Avatar>
                ) : <span className="grid h-7 w-7 place-items-center rounded-full bg-[#f1f5f5] text-[#94a8b5]"><CircleDot className="h-3.5 w-3.5" /></span>}
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
    <div className="overflow-hidden rounded-[22px] border border-[#dfeceb] bg-white shadow-[0_14px_40px_rgba(27,90,92,0.06)]">
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
                  <span className="min-w-0"><span className="block truncate text-sm font-bold text-[#173d56]">{task.title}</span><span className="mt-0.5 block truncate text-xs text-[#8195a8]">{task.description || 'Tanpa deskripsi'}</span></span>
                </span>
                <span className="ml-12 inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[10px] font-bold md:ml-0" style={{ backgroundColor: tone.soft, color: tone.accent }}>{column.title}</span>
                <span className="ml-12 flex items-center gap-1.5 text-xs text-[#7089a1] md:ml-0"><CalendarDays className="h-3.5 w-3.5" />{formatDueDate(task.dueDate)}</span>
                <EllipsisVertical className="hidden h-4 w-4 text-[#9ab0bc] md:block" />
              </motion.button>
            );
          });
        })}
      </div>
    </div>
  );
}

export default function TaskKanbanBoard({ boardData, setBoardData, onTaskClick, onAddTask, viewMode }: TaskKanbanBoardProps) {
  const [newColumnTitle, setNewColumnTitle] = React.useState('');
  const shouldReduceMotion = useReducedMotion();

  const onDragEnd = (result: DropResult) => {
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

  const handleAddColumn = () => {
    if (!newColumnTitle.trim()) return;
    const newColumnId = `column-${Date.now()}`;
    const newColumn: Column = { id: newColumnId, title: newColumnTitle.trim(), taskIds: [] };
    setBoardData((previous) => ({ ...previous, columns: { ...previous.columns, [newColumnId]: newColumn }, columnOrder: [...previous.columnOrder, newColumnId] }));
    setNewColumnTitle('');
  };

  const handleDeleteColumn = (columnId: string) => {
    const newColumns = { ...boardData.columns };
    const tasksToDelete = newColumns[columnId]?.taskIds ?? [];
    tasksToDelete.forEach((taskId) => {
      const attachmentId = boardData.tasks[taskId]?.attachment?.id;
      if (attachmentId) void deleteTaskAttachment(attachmentId).catch(() => undefined);
    });
    delete newColumns[columnId];
    const newTasks = { ...boardData.tasks };
    tasksToDelete.forEach((taskId) => delete newTasks[taskId]);
    setBoardData({ tasks: newTasks, columns: newColumns, columnOrder: boardData.columnOrder.filter((id) => id !== columnId) });
  };

  if (viewMode === 'list') return <TaskListView boardData={boardData} onTaskClick={onTaskClick} />;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="all-columns" direction="horizontal" type="column">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="grid min-w-0 grid-cols-1 items-stretch gap-3 rounded-[24px] border border-[#e0eeec] bg-[linear-gradient(145deg,#fbfefd,#f4faf9)] p-3 shadow-[0_16px_42px_rgba(27,90,92,0.055)] sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
          >
            {boardData.columnOrder.map((columnId, index) => {
              const column = boardData.columns[columnId];
              if (!column) return null;
              const tasks = column.taskIds.map((taskId) => boardData.tasks[taskId]).filter(Boolean) as Task[];
              const tone = getTone(index);
              const ColumnIcon = columnIcons[index] ?? Layers3;
              const progress = index < 3 ? tone.progress : tasks.length ? 40 : 0;

              return (
                <Draggable key={column.id} draggableId={column.id} index={index}>
                  {(providedColumn, snapshot) => (
                    <div ref={providedColumn.innerRef} {...providedColumn.draggableProps} className="min-w-0">
                      <Card className={cn('flex min-h-[448px] min-w-0 flex-col overflow-hidden rounded-[20px] border bg-white/90 shadow-[0_8px_24px_rgba(18,62,75,0.045)] transition-shadow duration-200', snapshot.isDragging && 'shadow-[0_20px_44px_rgba(15,159,143,0.18)]')} style={{ borderColor: tone.border }}>
                        <div {...providedColumn.dragHandleProps} className="relative border-b border-[#eef3f2] px-3.5 pb-3.5 pt-3.5">
                          <div className="flex items-center gap-2.5">
                                <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-xl', tone.icon)}><ColumnIcon className="h-4 w-4" strokeWidth={1.8} /></span>
                            <h3 className="min-w-0 flex-1 truncate text-[14px] font-bold text-[#173d56]">{column.title}</h3>
                            <span className="grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-[11px] font-extrabold" style={{ backgroundColor: tone.soft, color: tone.accent }}>{tasks.length}</span>
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0 rounded-lg text-[#7691a0] hover:bg-[#f0f8f6] hover:text-[#0f8f82] active:scale-95" onClick={(event) => { event.stopPropagation(); handleDeleteColumn(column.id); }} aria-label={`Hapus kolom ${column.title}`}><EllipsisVertical className="h-4 w-4" /></Button>
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e8efee]"><motion.div initial={{ width: shouldReduceMotion ? `${progress}%` : 0 }} animate={{ width: `${progress}%` }} transition={{ duration: shouldReduceMotion ? 0 : 0.65, ease: [0.22, 1, 0.36, 1] }} className="h-full rounded-full" style={{ backgroundColor: tone.accent }} /></div>
                            <span className="text-[10px] font-bold" style={{ color: tone.accent }}>{progress}%</span>
                          </div>
                        </div>

                        <Droppable droppableId={column.id} type="task">
                          {(providedTasks, snapshotTasks) => (
                            <div ref={providedTasks.innerRef} {...providedTasks.droppableProps} className={cn('flex flex-1 flex-col gap-2.5 p-2.5 transition-colors duration-200', snapshotTasks.isDraggingOver && 'bg-[#effaf7]')}>
                              {tasks.length > 0 ? tasks.map((task, taskIndex) => <TaskCard key={task.id} task={task} index={taskIndex} onTaskClick={onTaskClick} />) : (
                                <div className="flex min-h-[250px] flex-1 flex-col items-center justify-center rounded-[16px] border border-dashed border-[#dbeae7] bg-[radial-gradient(circle_at_50%_35%,#f0fbf7,transparent_55%)] px-5 text-center">
                                  <motion.div animate={shouldReduceMotion ? undefined : { y: [0, -5, 0], rotate: [0, 1, 0] }} transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }} className="relative mb-3 grid h-16 w-16 place-items-center rounded-full border border-[#b8e7d7] bg-[#f1fbf7] text-[#1bb35c] shadow-[0_12px_24px_rgba(27,179,92,0.12)]"><span className="absolute inset-1 rounded-full border border-dashed border-[#b8e7d7]" /><Check className="relative h-7 w-7" strokeWidth={2.5} /></motion.div>
                                  <p className="text-sm font-bold text-[#173d56]">Belum ada tugas</p>
                                  <p className="mt-1 max-w-[190px] text-xs leading-5 text-[#8197a9]">Tugas yang masuk ke kolom ini akan muncul di sini.</p>
                                </div>
                              )}
                              {providedTasks.placeholder}
                            </div>
                          )}
                        </Droppable>

                        <button type="button" onClick={() => onAddTask(column.id)} className="group flex items-center justify-center gap-2 border-t border-[#eef3f2] px-3 py-3.5 text-xs font-bold transition-colors hover:bg-[#f3fbf9] active:bg-[#e7f7f3]" style={{ color: tone.accent }}>
                          <Plus className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90" /> Tambah Tugas
                        </button>
                      </Card>
                    </div>
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}

            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }} className="min-w-0">
              <div className="flex min-h-[448px] min-w-0 flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-[#a9e4db] bg-[radial-gradient(circle_at_50%_26%,rgba(202,244,235,0.55),transparent_42%),rgba(251,255,254,0.7)] p-5 text-center transition-all duration-300 hover:border-[#0f9f8f] hover:bg-[#f0fbf8]">
                <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-[#d2eeea] bg-white text-[#0f9f8f] shadow-[0_8px_18px_rgba(15,159,143,0.1)] transition-transform duration-300 hover:scale-110 hover:rotate-3"><Plus className="h-7 w-7" strokeWidth={1.8} /></div>
                <p className="text-sm font-bold text-[#173d56]">Tambah kolom</p>
                <p className="mt-1 max-w-[190px] text-xs leading-5 text-[#8197a9]">Buat kolom baru sesuai kebutuhan alur kerja.</p>
                <div className="mt-5 flex w-full max-w-[210px] gap-2">
                  <Input value={newColumnTitle} onChange={(event) => setNewColumnTitle(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && handleAddColumn()} placeholder="Nama kolom" className="h-9 min-w-0 rounded-lg border-[#cfe8e4] bg-white text-xs" />
                  <Button type="button" onClick={handleAddColumn} size="icon" className="h-9 w-9 shrink-0 rounded-lg bg-[#0f9f8f] shadow-sm hover:bg-[#0b8c7e] active:scale-95"><Plus className="h-4 w-4" /></Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
