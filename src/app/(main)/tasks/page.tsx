'use client';

import * as React from 'react';
import { ArrowUpDown, ClipboardList, Filter, LayoutGrid, List, Plus, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Task, TaskBoardData } from '@/types';
import TaskKanbanBoard from '@/components/TaskKanbanBoard';
import AddTaskDialog from '@/components/AddTaskDialog';
import TaskDetailsDialog from '@/components/TaskDetailsDialog';
import { useLocalSession } from '@/components/main-shell';
import { ScrollReveal } from '@/components/motion';
import { deleteTaskAttachment } from '@/lib/task-attachments.mjs';
import { createDefaultTaskBoardData } from '@/lib/task-board-defaults';

async function responseError(response: Response) {
  try {
    const payload = await response.json();
    return typeof payload?.error === 'string' ? payload.error : `Permintaan gagal (${response.status}).`;
  } catch {
    return `Permintaan gagal (${response.status}).`;
  }
}

export default function TasksPage() {
  const { upc } = useLocalSession();
  const [boardData, setBoardData] = React.useState<TaskBoardData>(() => createDefaultTaskBoardData());
  const [isAddTaskModalOpen, setAddTaskModalOpen] = React.useState(false);
  const [selectedColumnId, setSelectedColumnId] = React.useState<string | null>(null);
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [isDetailsModalOpen, setDetailsModalOpen] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<'board' | 'list'>('board');
  const [filterActive, setFilterActive] = React.useState(false);
  const [sortActive, setSortActive] = React.useState(false);
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
        if (!response.ok) throw new Error(await responseError(response));

        const payload = await response.json();
        let loadedBoard = payload.boardData as TaskBoardData;
        let loadedVersion = Number(payload.version);

        if (loadedVersion === 0) {
          const legacyKey = `taskBoardData_${upc}`;
          const legacyRaw = localStorage.getItem(legacyKey);
          if (legacyRaw) {
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
        setBoardError(error instanceof Error ? error.message : 'Board tugas tidak dapat dimuat.');
        setBoardLoading(false);
      }
    };

    void loadTaskBoard();
    return () => {
      isActive = false;
      controller.abort();
    };
  }, [upc]);

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
        if (!response.ok) throw new Error(await responseError(response));
        const payload = await response.json();
        boardVersionRef.current = Number(payload.version);
        setSyncError(null);
      }).catch((error) => {
        setSyncError(error instanceof Error ? error.message : 'Perubahan board belum tersimpan.');
      });
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [boardData, boardError, isBoardLoading]);

  const handleOpenAddTaskModal = (columnId: string) => {
    setSelectedColumnId(columnId);
    setAddTaskModalOpen(true);
  };

  const handleAddTask = (task: Omit<Task, 'id'>, columnId: string) => {
    const newTaskId = `task-${Date.now()}`;
    const newTask: Task = { id: newTaskId, ...task };

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

  const handleDeleteTask = (taskId: string) => {
    const attachmentId = boardData.tasks[taskId]?.attachment?.id;
    if (attachmentId) void deleteTaskAttachment(attachmentId).catch((error) => console.error('Failed to delete task attachment', error));

    setBoardData((previous) => {
      const newTasks = { ...previous.tasks };
      delete newTasks[taskId];
      const newColumns = Object.fromEntries(Object.entries(previous.columns).map(([columnId, column]) => [columnId, { ...column, taskIds: column.taskIds.filter((id) => id !== taskId) }]));
      return { ...previous, tasks: newTasks, columns: newColumns };
    });
  };

  const totalTasks = Object.keys(boardData.tasks).length;

  return (
    <main className="min-w-0 flex-1 bg-[#f8fcfb]">
      <ScrollReveal direction="up">
        <section className="relative overflow-hidden border-b border-[#e1eeec] bg-white px-4 py-4 sm:px-6 lg:px-8">
          <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full border border-[#d9f0ec]" />
          <div className="pointer-events-none absolute right-16 -top-8 h-20 w-20 rounded-full border border-[#e9f6f3]" />
          <div className="relative flex min-w-0 flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#e2f7f2] text-[#0f9f8f] shadow-[0_8px_18px_rgba(15,159,143,0.1)]"><ClipboardList className="h-6 w-6" strokeWidth={1.8} /></span>
              <div className="min-w-0">
                <h1 className="truncate font-headline text-xl font-extrabold tracking-[-0.03em] text-[#12324a] sm:text-2xl">Lacak Tugas &amp; Alur Kerja</h1>
                <p className="mt-1 truncate text-xs text-[#6d879b] sm:text-sm">Pantau seluruh progres pekerjaan secara real-time dan kolaboratif.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 xl:shrink-0">
              <Button type="button" variant="outline" aria-pressed={filterActive} onClick={() => setFilterActive((active) => !active)} className={filterActive ? 'h-10 rounded-xl border-[#9edfd5] bg-[#eaf8f5] px-4 text-[#0d877b] shadow-sm active:scale-95' : 'h-10 rounded-xl border-[#dcebe9] bg-white px-4 text-[#49667d] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#b5ded8] hover:bg-[#f5fbfa] active:translate-y-0 active:scale-95'}><Filter className="h-4 w-4" /> Filter</Button>
              <Button type="button" variant="outline" aria-pressed={sortActive} onClick={() => setSortActive((active) => !active)} className={sortActive ? 'h-10 rounded-xl border-[#9edfd5] bg-[#eaf8f5] px-4 text-[#0d877b] shadow-sm active:scale-95' : 'h-10 rounded-xl border-[#dcebe9] bg-white px-4 text-[#49667d] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#b5ded8] hover:bg-[#f5fbfa] active:translate-y-0 active:scale-95'}><ArrowUpDown className="h-4 w-4" /> Urutkan</Button>
              <Button type="button" onClick={() => boardData.columnOrder[0] && handleOpenAddTaskModal(boardData.columnOrder[0])} className="h-10 rounded-xl bg-[#0f9f8f] px-4 text-white shadow-[0_9px_22px_rgba(15,159,143,0.2)] transition-all hover:-translate-y-0.5 hover:bg-[#0b8d7e] active:translate-y-0 active:scale-95"><Plus className="h-4 w-4" /> Tambah Tugas</Button>
            </div>
          </div>
          {(filterActive || sortActive) && <div className="relative mt-3 flex items-center gap-2 text-xs text-[#0f877b]"><SlidersHorizontal className="h-3.5 w-3.5" />{filterActive ? 'Filter siap digunakan pada board ini.' : 'Urutan board aktif untuk sesi ini.'}</div>}
        </section>
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0.08}>
        <section className="min-w-0 px-3 py-3 sm:px-5 sm:py-4 lg:px-7">
          {isBoardLoading ? (
            <div className="grid min-h-[420px] place-items-center rounded-[24px] border border-[#dcebe9] bg-white text-sm font-medium text-[#6d879b] shadow-[0_16px_44px_rgba(16,42,67,.06)]">
              Memuat board tugas dari PostgreSQL...
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
              <TaskKanbanBoard boardData={boardData} setBoardData={setBoardData} onTaskClick={handleTaskClick} onAddTask={handleOpenAddTaskModal} viewMode={viewMode} />

              {syncError && <div role="alert" className="mt-3 rounded-xl border border-[#f1d19a] bg-[#fffaf0] px-4 py-3 text-xs font-medium text-[#8c641d]">Perubahan terakhir belum tersimpan: {syncError}</div>}

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
