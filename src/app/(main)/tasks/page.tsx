'use client';

import * as React from 'react';
import { ArrowUpDown, Check, ClipboardList, Filter, Layers3, LayoutGrid, List, Plus, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Task, TaskBoardData } from '@/types';
import TaskKanbanBoard from '@/components/TaskKanbanBoard';
import AddTaskDialog from '@/components/AddTaskDialog';
import TaskDetailsDialog from '@/components/TaskDetailsDialog';
import { useLocalSession } from '@/components/main-shell';
import { ScrollReveal } from '@/components/motion';
import { deleteTaskAttachment } from '@/lib/task-attachments.mjs';
import { createDefaultTaskBoardData } from '@/lib/task-board-defaults';
import { sortTaskIds, taskMatchesFilter, TASK_FILTER_OPTIONS, TASK_SORT_OPTIONS } from '@/lib/task-board-view.mjs';
import { getUserFacingMessage } from '@/lib/user-facing-message.mjs';

type TaskFilter = 'all' | 'high' | 'medium' | 'low' | 'flagged' | 'attachment';
type SortMode = 'oldest' | 'newest' | 'nearest';

const priorityFilterOptions = TASK_FILTER_OPTIONS as Array<{ value: TaskFilter; label: string }>;
const sortOptions = TASK_SORT_OPTIONS as Array<{ value: SortMode; label: string }>;

function createVisibleBoardData(boardData: TaskBoardData, filter: TaskFilter, sort: SortMode): TaskBoardData {
  const visibleTaskIds = new Set(Object.values(boardData.tasks).filter((task) => taskMatchesFilter(task, filter)).map((task) => task.id));
  const tasks = Object.fromEntries(Object.entries(boardData.tasks).filter(([taskId]) => visibleTaskIds.has(taskId))) as TaskBoardData['tasks'];
  const columns = Object.fromEntries(Object.entries(boardData.columns).map(([columnId, column]) => {
    const taskIds = sortTaskIds(column.taskIds.filter((taskId) => visibleTaskIds.has(taskId)), boardData.tasks, sort);

    return [columnId, { ...column, taskIds }];
  })) as TaskBoardData['columns'];

  return { tasks, columns, columnOrder: boardData.columnOrder };
}

async function responseError(response: Response, fallback: string) {
  try {
    const payload = await response.json() as { error?: unknown };
    return getUserFacingMessage(payload.error, fallback);
  } catch {
    // The response body may be empty; keep the message user-facing either way.
  }
  return fallback;
}

export default function TasksPage() {
  const session = useLocalSession();
  const upc = session.upc;
  const userId = session.userId;
  const userName = session.name;
  const legacyBoardKeys = React.useMemo(
    () => (session.role === 'superadmin' ? [`taskBoardData_${userId}`, 'taskBoardData_all'] : [`taskBoardData_${upc}`]),
    [session.role, userId, upc],
  );
  const [boardData, setBoardData] = React.useState<TaskBoardData>(() => createDefaultTaskBoardData());
  const [isAddTaskModalOpen, setAddTaskModalOpen] = React.useState(false);
  const [selectedColumnId, setSelectedColumnId] = React.useState<string | null>(null);
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [isDetailsModalOpen, setDetailsModalOpen] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<'board' | 'list'>('board');
  const [priorityFilter, setPriorityFilter] = React.useState<TaskFilter>('all');
  const [sortMode, setSortMode] = React.useState<SortMode>('oldest');
  const [newColumnTitle, setNewColumnTitle] = React.useState('');
  const [isBoardLoading, setBoardLoading] = React.useState(true);
  const [boardError, setBoardError] = React.useState<string | null>(null);
  const [syncError, setSyncError] = React.useState<string | null>(null);
  const boardVersionRef = React.useRef(0);
  const saveQueueRef = React.useRef(Promise.resolve());
  const skipNextSaveRef = React.useRef(false);

  React.useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const loadTaskBoard = async () => {
      setBoardLoading(true);
      setBoardError(null);
      try {
        const response = await fetch('/api/tasks', { cache: 'no-store', signal: controller.signal });
        if (!response.ok) throw new Error(await responseError(response, 'Tugas belum dapat dimuat. Coba lagi.'));

        const payload = await response.json();
        let loadedBoard = payload.boardData as TaskBoardData;
        let loadedVersion = Number(payload.version);

        if (loadedVersion === 0) {
          for (const legacyKey of legacyBoardKeys) {
            const legacyRaw = localStorage.getItem(legacyKey);
            if (!legacyRaw) continue;
            try {
              const migrationResponse = await fetch('/api/tasks', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ boardData: JSON.parse(legacyRaw), version: 0 }),
                signal: controller.signal,
              });
              if (migrationResponse.ok) {
                const migrated = await migrationResponse.json();
                loadedBoard = migrated.boardData as TaskBoardData;
                loadedVersion = Number(migrated.version);
                localStorage.removeItem(legacyKey);
                break;
              }
            } catch (migrationError) {
              console.warn('Migrasi board lama dilewati:', migrationError);
            }
          }
        }

        if (!isActive) return;
        setBoardData(loadedBoard);
        boardVersionRef.current = loadedVersion;
        skipNextSaveRef.current = loadedVersion > 0;
        setBoardLoading(false);
      } catch (error) {
        if (!isActive || (error instanceof DOMException && error.name === 'AbortError')) return;
        setBoardError(getUserFacingMessage(error, 'Tugas belum dapat dimuat. Periksa koneksi lalu coba lagi.'));
        setBoardLoading(false);
      }
    };

    void loadTaskBoard();
    return () => {
      isActive = false;
      controller.abort();
    };
  }, [legacyBoardKeys]);

  React.useEffect(() => {
    if (isBoardLoading || boardError) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }

    const snapshot = boardData;
    const timeout = window.setTimeout(() => {
      saveQueueRef.current = saveQueueRef.current.then(async () => {
        const response = await fetch('/api/tasks', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ boardData: snapshot, version: boardVersionRef.current }),
        });
        if (!response.ok) throw new Error(await responseError(response, 'Perubahan tugas belum tersimpan. Coba lagi.'));
        const payload = await response.json();
        boardVersionRef.current = Number(payload.version);
        setSyncError(null);
      }).catch((error) => {
        setSyncError(getUserFacingMessage(error, 'Perubahan tugas belum tersimpan. Periksa koneksi lalu coba lagi.'));
      });
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [boardData, boardError, isBoardLoading]);

  const handleOpenAddTaskModal = (columnId: string) => {
    setSelectedColumnId(columnId);
    setAddTaskModalOpen(true);
  };

  const handleAddTask = (task: Pick<Task, 'title' | 'description' | 'priority' | 'dueDate' | 'attachment' | 'attachments'>, columnId: string) => {
    const newTaskId = `task-${Date.now()}`;
    const newTask: Task = {
      id: newTaskId,
      ...task,
      createdAt: new Date().toISOString(),
      createdByUserId: userId,
      createdByName: userName,
      createdBy: userName,
    };

    setBoardData((previous) => {
      const column = previous.columns[columnId];
      if (!column) return previous;
      return {
        ...previous,
        tasks: { ...previous.tasks, [newTaskId]: newTask },
        columns: { ...previous.columns, [columnId]: { ...column, taskIds: [...column.taskIds, newTaskId] } },
      };
    });
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setDetailsModalOpen(true);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setBoardData((previous) => ({ ...previous, tasks: { ...previous.tasks, [updatedTask.id]: updatedTask } }));
    setSelectedTask(updatedTask);
  };

  const handleToggleFlagged = (taskId: string) => {
    setBoardData((previous) => {
      const task = previous.tasks[taskId];
      if (!task) return previous;
      const updatedTask = { ...task, isFlagged: !task.isFlagged };
      return { ...previous, tasks: { ...previous.tasks, [taskId]: updatedTask } };
    });
    setSelectedTask((task) => (task?.id === taskId ? { ...task, isFlagged: !task.isFlagged } : task));
  };

  const handleAddColumn = (title: string) => {
    const normalizedTitle = title.trim();
    if (!normalizedTitle) return;
    const newColumnId = `column-${Date.now()}`;
    setBoardData((previous) => ({
      ...previous,
      columns: { ...previous.columns, [newColumnId]: { id: newColumnId, title: normalizedTitle, taskIds: [] } },
      columnOrder: [...previous.columnOrder, newColumnId],
    }));
    setNewColumnTitle('');
  };

  const handleDeleteColumn = (columnId: string) => {
    setBoardData((previous) => {
      const column = previous.columns[columnId];
      const deletedIndex = previous.columnOrder.indexOf(columnId);
      const remainingOrder = previous.columnOrder.filter((id) => id !== columnId);
      if (!column || deletedIndex < 0 || remainingOrder.length === 0) return previous;

      const targetColumnId = remainingOrder[Math.max(0, deletedIndex - 1)] ?? remainingOrder[0];
      const targetColumn = previous.columns[targetColumnId];
      if (!targetColumn) return previous;

      const nextColumns = {
        ...previous.columns,
        [targetColumnId]: { ...targetColumn, taskIds: [...targetColumn.taskIds, ...column.taskIds] },
      };
      delete nextColumns[columnId];
      return {
        ...previous,
        columns: nextColumns,
        columnOrder: remainingOrder,
      };
    });
  };

  const handleDeleteTask = (taskId: string) => {
    const task = boardData.tasks[taskId];
    const attachmentIds = [
      ...(task?.attachments ?? []),
      ...(task?.attachment ? [task.attachment] : []),
    ].map((attachment) => attachment.id);
    if (attachmentIds.length) {
      void Promise.all([...new Set(attachmentIds)].map((attachmentId) => deleteTaskAttachment(attachmentId)))
        .catch((error) => console.error('Failed to delete task attachments', error));
    }

    setBoardData((previous) => {
      const newTasks = { ...previous.tasks };
      delete newTasks[taskId];
      const newColumns = Object.fromEntries(Object.entries(previous.columns).map(([columnId, column]) => [columnId, { ...column, taskIds: column.taskIds.filter((id) => id !== taskId) }]));
      return { ...previous, tasks: newTasks, columns: newColumns };
    });
  };

  const totalTasks = Object.keys(boardData.tasks).length;
  const visibleBoardData = React.useMemo(() => createVisibleBoardData(boardData, priorityFilter, sortMode), [boardData, priorityFilter, sortMode]);
  const visibleTasks = Object.keys(visibleBoardData.tasks).length;
  const activeFilterLabel = priorityFilterOptions.find((option) => option.value === priorityFilter)?.label ?? 'Semua prioritas';
  const activeSortLabel = sortOptions.find((option) => option.value === sortMode)?.label ?? 'Terlama';
  const isFocusedView = priorityFilter !== 'all' || sortMode !== 'oldest';

  return (
    <main className="min-w-0 flex-1 bg-[#f8fcfb]">
      <ScrollReveal direction="up">
        <section className="relative overflow-hidden border-b border-[#e1eeec] bg-white px-4 py-4 sm:px-6 lg:px-8">
          <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full border border-[#d9f0ec]" />
          <div className="pointer-events-none absolute right-16 -top-8 h-20 w-20 rounded-full border border-[#e9f6f3]" />
          {isBoardLoading ? (
            <div className="tasks-loading-hero relative flex min-w-0 flex-col gap-4 xl:flex-row xl:items-center xl:justify-between" aria-hidden="true">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[#dcebe9] bg-[#f3fbf8]">
                  <span className="tasks-loading-hero-icon" />
                </span>
                <div className="min-w-0 space-y-2">
                  <span className="tasks-loading-hero-line h-7 w-[240px] max-w-[72vw]" />
                  <span className="tasks-loading-hero-line h-4 w-[360px] max-w-[82vw]" />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 xl:shrink-0">
                <span className="tasks-loading-hero-chip h-10 w-[108px] rounded-xl" />
                <span className="tasks-loading-hero-chip h-10 w-[122px] rounded-xl" />
                <span className="tasks-loading-hero-chip h-10 w-[158px] rounded-xl" />
              </div>
            </div>
          ) : (
            <>
              <div className="relative flex min-w-0 flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#e2f7f2] text-[#0f9f8f] shadow-[0_8px_18px_rgba(15,159,143,0.1)]"><Layers3 className="h-6 w-6" strokeWidth={1.8} /></span>
                  <div className="min-w-0">
                    <h1 className="truncate font-headline text-xl font-extrabold tracking-[-0.03em] text-[#12324a] sm:text-2xl">Lacak Tugas &amp; Alur Kerja</h1>
                    <p className="mt-1 truncate text-xs text-[#6d879b] sm:text-sm">Pantau seluruh progres pekerjaan secara real-time dan kolaboratif.</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 xl:shrink-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="outline" aria-pressed={priorityFilter !== 'all'} className={priorityFilter !== 'all' ? 'h-10 rounded-xl border-[#9edfd5] bg-[#eaf8f5] px-4 text-[#0d877b] shadow-sm active:scale-95' : 'h-10 rounded-xl border-[#dcebe9] bg-white px-4 text-[#49667d] shadow-sm transition-[transform,background-color,border-color] duration-180 ease-out hover:-translate-y-0.5 hover:border-[#b5ded8] hover:bg-[#f5fbfa] active:translate-y-0 active:scale-95'}><Filter className="h-4 w-4" /> Filter</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 rounded-xl border-[#dcebe9] p-1.5 shadow-[0_16px_34px_rgba(18,62,75,0.12)]">
                      {priorityFilterOptions.map((option) => (
                        <DropdownMenuItem key={option.value} onClick={() => setPriorityFilter(option.value)} className={priorityFilter === option.value ? 'flex items-center justify-between rounded-[10px] border border-[#b9e7e3] bg-[#dff3f2] text-xs font-semibold text-[#0f5f67] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]' : 'flex items-center justify-between rounded-[10px] text-xs font-semibold text-[#173d56]'}>
                          {option.label}
                          {priorityFilter === option.value && <Check className="h-3.5 w-3.5 text-[#0f9f8f]" />}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="outline" aria-pressed={sortMode !== 'oldest'} className={sortMode !== 'oldest' ? 'h-10 rounded-xl border-[#9edfd5] bg-[#eaf8f5] px-4 text-[#0d877b] shadow-sm active:scale-95' : 'h-10 rounded-xl border-[#dcebe9] bg-white px-4 text-[#49667d] shadow-sm transition-[transform,background-color,border-color] duration-180 ease-out hover:-translate-y-0.5 hover:border-[#b5ded8] hover:bg-[#f5fbfa] active:translate-y-0 active:scale-95'}><ArrowUpDown className="h-4 w-4" /> Urutkan</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-xl border-[#dcebe9] p-1.5 shadow-[0_16px_34px_rgba(18,62,75,0.12)]">
                      {sortOptions.map((option) => (
                        <DropdownMenuItem key={option.value} onClick={() => setSortMode(option.value)} className={sortMode === option.value ? 'flex items-center justify-between rounded-[10px] border border-[#b9e7e3] bg-[#dff3f2] text-xs font-semibold text-[#0f5f67] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]' : 'flex items-center justify-between rounded-[10px] text-xs font-semibold text-[#173d56]'}>
                          {option.label}
                          {sortMode === option.value && <Check className="h-3.5 w-3.5 text-[#0f9f8f]" />}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                      </DropdownMenu>
                          <Button type="button" onClick={() => boardData.columnOrder[0] && handleOpenAddTaskModal(boardData.columnOrder[0])} className="h-10 rounded-xl bg-[#0f9f8f] px-4 text-white shadow-[0_9px_22px_rgba(15,159,143,0.2)] transition-[transform,background-color] duration-180 ease-out hover:-translate-y-0.5 hover:bg-[#0b8d7e] active:translate-y-0 active:scale-95"><Plus className="h-4 w-4" /> Tambah Tugas</Button>
                </div>
              </div>
              {isFocusedView && <div className="relative mt-3 flex flex-wrap items-center gap-2 text-xs text-[#0f877b]"><SlidersHorizontal className="h-3.5 w-3.5" /><span>{activeFilterLabel} - {activeSortLabel} - {visibleTasks} dari {totalTasks} tugas</span><button type="button" onClick={() => { setPriorityFilter('all'); setSortMode('oldest'); }} className="rounded-full border border-[#bde7df] bg-white px-2 py-0.5 font-bold text-[#0f877b] transition-colors hover:bg-[#edf9f6] active:scale-95">Reset</button></div>}
            </>
          )}
        </section>
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0.08}>
        <section className="min-w-0 px-3 py-3 sm:px-5 sm:py-4 lg:px-7">
          {isBoardLoading ? (
            <div className="tasks-loading-panel min-h-[420px] rounded-[24px] border border-[#dcebe9] bg-white p-5 shadow-[0_16px_44px_rgba(16,42,67,.06)]">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <span className="tasks-loading-orbit" aria-hidden="true">
                    <span />
                    <ClipboardList className="h-6 w-6" strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#0f877b]">Menyiapkan board</p>
                    <h2 className="mt-1 font-headline text-lg font-extrabold tracking-[-0.03em] text-[#173d56]">Daftar tugas sedang dirapikan</h2>
                    <p className="mt-1 max-w-xl text-sm leading-6 text-[#6d879b]">Kami menyusun kolom, prioritas, lampiran, dan urutan tugas agar siap dipantau.</p>
                  </div>
                </div>

                <div className="grid gap-2 text-xs font-semibold text-[#547188] sm:grid-cols-3 lg:min-w-[420px]">
                  {['Membaca tugas', 'Menyusun kolom', 'Menyiapkan tampilan'].map((step, index) => (
                    <div key={step} className="tasks-loading-step" style={{ animationDelay: `${index * 140}ms` }}>
                      <span>{index + 1}</span>
                      {step}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-[#5d7586]">
                <span className="tasks-loading-status">
                  <span className="tasks-loading-status-dot" />
                  Sinkronisasi aman
                </span>
                  <span className="tasks-loading-status">Prioritas, lampiran, dan pembuat tugas disiapkan</span>
                <span className="tasks-loading-status">Tampilan board dirapikan</span>
              </div>

              <div className="tasks-loading-track mt-5" aria-hidden="true">
                <span />
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-4" aria-hidden="true">
                {['Daftar Tugas', 'Sedang Dikerjakan', 'Selesai', 'Tambah Kolom'].map((column, columnIndex) => (
                  <div key={column} className="tasks-loading-column" style={{ animationDelay: `${columnIndex * 110}ms` }}>
                    <div className="flex items-center justify-between">
                      <span className="tasks-loading-pill" />
                      <span className="h-5 w-5 rounded-full bg-[#edf6f2]" />
                    </div>
                    <div className="mt-4 space-y-3">
                      {Array.from({ length: columnIndex === 2 ? 1 : 3 }).map((_, cardIndex) => (
                        <div key={cardIndex} className="tasks-loading-card">
                          <span className="w-3/4" />
                          <span className="w-full" />
                          <span className="w-2/5" />
                          <div className="tasks-loading-card-foot">
                            <span className="tasks-loading-avatar" />
                            <span className="tasks-loading-chip w-14" />
                            <span className="tasks-loading-chip w-8" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : boardError ? (
            <div role="alert" className="grid min-h-[280px] place-items-center rounded-[24px] border border-[#f3c8c8] bg-[#fffafa] px-6 text-center text-sm text-[#a33b3b] shadow-[0_16px_44px_rgba(140,40,40,.06)]">
              <div>
                    <p className="font-bold">Board tugas belum dapat dimuat.</p>
                <p className="mt-1 max-w-xl text-[#a96767]">{boardError}</p>
                <Button type="button" variant="outline" onClick={() => window.location.reload()} className="mt-4 rounded-xl border-[#e9aaaa] text-[#a33b3b] hover:bg-[#fff0f0]">Coba lagi</Button>
              </div>
            </div>
          ) : (
            <>
              <TaskKanbanBoard boardData={visibleBoardData} setBoardData={setBoardData} onTaskClick={handleTaskClick} onToggleFlagged={handleToggleFlagged} onAddColumn={handleAddColumn} onDeleteColumn={handleDeleteColumn} newColumnTitle={newColumnTitle} onNewColumnTitleChange={setNewColumnTitle} viewMode={viewMode} isReadOnlyView={isFocusedView} />

              {syncError && <div role="alert" className="mt-3 rounded-xl border border-[#f1d19a] bg-[#fffaf0] px-4 py-3 text-xs font-medium text-[#8c641d]">Perubahan terbaru belum tersimpan: {syncError}</div>}

              <footer className="mt-3 flex flex-col gap-3 px-1 text-sm text-[#6c87a0] sm:flex-row sm:items-center sm:justify-between">
                <span className="flex items-center gap-2"><ClipboardList className="h-4 w-4 text-[#547c98]" /> Total {totalTasks} tugas</span>
                <div className="tasks-view-toggle inline-flex self-end p-1 sm:self-auto">
                  <button type="button" aria-pressed={viewMode === 'board'} data-active={viewMode === 'board'} onClick={() => setViewMode('board')} className="tasks-view-button"><LayoutGrid className="h-4 w-4" /> Board</button>
                  <button type="button" aria-pressed={viewMode === 'list'} data-active={viewMode === 'list'} onClick={() => setViewMode('list')} className="tasks-view-button"><List className="h-4 w-4" /> Daftar</button>
                </div>
              </footer>
            </>
          )}
        </section>
      </ScrollReveal>

      {!isBoardLoading && !boardError && selectedColumnId && <AddTaskDialog isOpen={isAddTaskModalOpen} onClose={() => setAddTaskModalOpen(false)} onAddTask={handleAddTask} columnId={selectedColumnId} />}

      <TaskDetailsDialog isOpen={isDetailsModalOpen} onClose={() => setDetailsModalOpen(false)} task={selectedTask} onUpdateTask={handleUpdateTask} onDeleteTask={handleDeleteTask} />
    </main>
  );
}
