import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { normalizeTaskBoardData } from '../src/lib/task-board-contract.mjs';

const pagePath = new URL('../src/app/(main)/tasks/page.tsx', import.meta.url);
const boardPath = new URL('../src/components/TaskKanbanBoard.tsx', import.meta.url);
const addTaskPath = new URL('../src/components/AddTaskDialog.tsx', import.meta.url);
const detailsPath = new URL('../src/components/TaskDetailsDialog.tsx', import.meta.url);
const typesPath = new URL('../src/types/index.ts', import.meta.url);
const defaultsPath = new URL('../src/lib/task-board-defaults.ts', import.meta.url);
const validationPath = new URL('../src/lib/task-board-validation.mjs', import.meta.url);
const contractPath = new URL('../src/lib/task-board-contract.mjs', import.meta.url);
const routePath = new URL('../src/app/api/tasks/route.ts', import.meta.url);
const repositoryPath = new URL('../src/lib/task-board-repository.ts', import.meta.url);

const [page, board, addTask, details, types, defaults, validation, contract, route, repository] = await Promise.all([
  readFile(pagePath, 'utf8'),
  readFile(boardPath, 'utf8'),
  readFile(addTaskPath, 'utf8'),
  readFile(detailsPath, 'utf8'),
  readFile(typesPath, 'utf8'),
  readFile(defaultsPath, 'utf8'),
  readFile(validationPath, 'utf8'),
  readFile(contractPath, 'utf8'),
  readFile(routePath, 'utf8'),
  readFile(repositoryPath, 'utf8'),
]);

test('task contract stores priority and creation metadata instead of labels or assignees', () => {
  assert.match(types, /export type TaskPriority = 'tinggi' \| 'sedang' \| 'rendah'/);
  assert.match(types, /priority: TaskPriority/);
  assert.match(types, /createdAt: string/);
  assert.match(defaults, /priority:/);
  assert.match(defaults, /createdAt:/);
  assert.doesNotMatch(defaults, /assignee:/);
  assert.doesNotMatch(defaults, /labels:/);
  assert.match(addTask, /priority,/);
  assert.doesNotMatch(addTask, /labels:\s*\[/);
  assert.doesNotMatch(details, /Tambah label baru|handleAddLabel|currentTask\.labels/);
});

test('database validation rejects legacy label and assignee fields', () => {
  assert.match(validation, /task\.priority/);
  assert.match(validation, /task\.createdAt/);
  assert.match(validation, /task\.isFlagged/);
  assert.match(validation, /assignee|labels/);
});

test('legacy task records are normalized to the signed creator and canonical priority fields', () => {
  const creator = { userId: 'user-actual', name: 'Superadmin NAVIGA' };
  const legacyBoard = {
    tasks: {
      legacy: {
        id: 'legacy',
        title: 'Tugas lama',
        labels: ['Penting'],
        assignee: { name: 'Admin 1' },
        createdByUserId: 'admin-1',
        createdByName: 'Admin 1',
        isFavorite: true,
        dueDate: '2026-08-10T00:00:00.000Z',
      },
    },
    columns: { todo: { id: 'todo', title: 'Daftar Tugas', taskIds: ['legacy'] } },
    columnOrder: ['todo'],
  };

  const normalized = normalizeTaskBoardData(legacyBoard, creator);
  const task = normalized.tasks.legacy;
  assert.equal(task.priority, 'tinggi');
  assert.equal(task.createdByUserId, creator.userId);
  assert.equal(task.createdByName, creator.name);
  assert.equal(task.isFlagged, true);
  assert.equal(task.createdAt, legacyBoard.tasks.legacy.dueDate);
  assert.equal('labels' in task, false);
  assert.equal('assignee' in task, false);
  assert.equal('isFavorite' in task, false);

  const updated = normalizeTaskBoardData({
    ...normalized,
    tasks: {
      ...normalized.tasks,
      legacy: { ...task, createdByUserId: 'spoofed', createdByName: 'Akun lain' },
      fresh: { id: 'fresh', title: 'Tugas baru', priority: 'rendah', createdAt: '2026-08-02T00:00:00.000Z', createdByUserId: 'spoofed', createdByName: 'Akun lain' },
    },
    columns: { todo: { ...normalized.columns.todo, taskIds: ['legacy', 'fresh'] } },
  }, creator, { previousBoardData: normalized });
  assert.equal(updated.tasks.legacy.createdByName, creator.name);
  assert.equal(updated.tasks.fresh.createdByName, creator.name);
});

test('task board filters by priority and exposes exactly three general sort modes', async () => {
  const view = await import('../src/lib/task-board-view.mjs');

  assert.deepEqual(view.TASK_SORT_OPTIONS.map((option) => option.label), ['Terlama', 'Terbaru', 'Terdekat']);
  assert.deepEqual(view.TASK_FILTER_OPTIONS.map((option) => option.label), [
    'Semua prioritas',
    'Prioritas tinggi',
    'Prioritas sedang',
    'Prioritas rendah',
    'Ditandai',
    'Ada lampiran',
  ]);

  const tasks = {
    old: { id: 'old', priority: 'rendah', createdAt: '2026-07-01T00:00:00.000Z', dueDate: '2026-08-20T00:00:00.000Z' },
    new: { id: 'new', priority: 'tinggi', createdAt: '2026-08-02T00:00:00.000Z', dueDate: '2026-08-10T00:00:00.000Z' },
    soon: { id: 'soon', priority: 'sedang', createdAt: '2026-07-15T00:00:00.000Z', dueDate: '2026-08-05T00:00:00.000Z' },
  };

  assert.deepEqual(view.sortTaskIds(['new', 'old', 'soon'], tasks, 'oldest'), ['old', 'soon', 'new']);
  assert.deepEqual(view.sortTaskIds(['old', 'soon', 'new'], tasks, 'newest'), ['new', 'soon', 'old']);
  assert.deepEqual(view.sortTaskIds(['old', 'new', 'soon'], tasks, 'nearest'), ['soon', 'new', 'old']);
  assert.equal(view.taskMatchesFilter(tasks.new, 'high'), true);
  assert.equal(view.taskMatchesFilter(tasks.new, 'low'), false);
});

test('task board UI keeps the star action, aligned priority visuals, and compact cards', () => {
  assert.match(board, /Star/);
  assert.match(board, /Flag/);
  assert.match(board, /onPointerDown=\{\(event\) => event\.stopPropagation\(\)\}/);
  assert.match(board, /bg-\[#fff4f4\] text-\[#ff4f44\]/);
  assert.match(board, /bg-\[#fff8ef\] text-\[#f08b00\]/);
  assert.match(board, /bg-\[#fffdf0\] text-\[#d79e00\]/);
  assert.match(board, /line-clamp-3/);
  assert.doesNotMatch(board, /h-\[3\.75rem\]/);
  assert.match(board, /whitespace-normal/);
  assert.match(board, /new-column-title/);
  assert.match(board, /onAddColumn/);
  assert.match(board, /In Progress/);
  assert.match(page, /Tambah Kolom/);
  assert.doesNotMatch(board, /aria-label="Tambah kolom"/);
  assert.doesNotMatch(page, /isAddColumnModalOpen/);
  assert.doesNotMatch(page, /setAddColumnModalOpen/);
  assert.doesNotMatch(page, /Semua label|Berbintang|Urutan board|Berbintang dulu/);
  assert.match(page, /> Filter</);
  assert.match(page, /Layers3 className="h-6 w-6" strokeWidth=\{1\.8\}/);
  assert.match(board, /CheckCircle2 aria-hidden="true" className="relative h-9 w-9" strokeWidth=\{1\.8\}/);
  assert.match(board, /task-empty-state-dots/);
  assert.match(board, /Array\.from\(\{ length: 8 \}\)/);
  assert.match(page, /TASK_FILTER_OPTIONS/);
  assert.match(page, /TASK_SORT_OPTIONS/);
});

test('attachment review remains visible from task details', () => {
  assert.match(details, /Pratinjau/);
  assert.match(details, /previewTaskAttachment/);
});

test('tasks API normalizes creator identity from the authenticated session before writing PostgreSQL JSONB', () => {
  assert.match(route, /requireSession/);
  assert.match(route, /getTaskBoard\(scopeKey, session\)/);
  assert.match(route, /saveTaskBoard\(scopeKey, payload\.boardData, payload\.version, session\)/);
  assert.match(repository, /normalizeTaskBoardData/);
  assert.match(repository, /creatorFromSession\(session\)/);
  assert.match(contract, /createdByUserId/);
  assert.match(contract, /createdByName/);
  assert.match(repository, /JSONB/);
});
