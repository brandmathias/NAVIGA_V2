import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const boardSource = await readFile(new URL('../src/components/TaskKanbanBoard.tsx', import.meta.url), 'utf8');
const detailsSource = await readFile(new URL('../src/components/TaskDetailsDialog.tsx', import.meta.url), 'utf8');
const descriptionHelper = await readFile(new URL('../src/lib/task-description.ts', import.meta.url), 'utf8').catch(() => '');

test('task board uses a responsive grid instead of a horizontal scroller', () => {
  assert.match(boardSource, /grid/);
  assert.match(boardSource, /min-w-0/);
  assert.doesNotMatch(boardSource, /overflow-x-auto/);
});

test('add-column card stays in the desktop kanban row', () => {
  assert.match(boardSource, /2xl:grid-cols-4/);
  assert.match(boardSource, /Tambah kolom/);
});

test('favorite star does not open the task detail card', () => {
  assert.match(boardSource, /handleFavoriteClick/);
  assert.match(boardSource, /event\.stopPropagation\(\)/);
  assert.match(boardSource, /TooltipContent side="right"/);
});

test('task cards keep creator metadata compact under the date and attachment row', () => {
  assert.match(boardSource, /getCreatorName/);
  assert.match(boardSource, /getCreatorPhotoSrc/);
  assert.match(boardSource, /createdByName/);
  assert.match(boardSource, /\/api\/users\/\$\{encodeURIComponent/);
  assert.match(boardSource, /Pembuat: \$\{creatorName\}/);
  assert.doesNotMatch(boardSource, /AvatarImage src=\{task\.assignee\?\.avatar\}/);
});

test('kanban cards keep complete Indonesian month names and compact creator row', () => {
  assert.match(boardSource, /month: 'long'/);
  assert.match(boardSource, /whitespace-nowrap/);
  assert.match(boardSource, /className="mt-2 flex min-w-0 items-center gap-2/);
});

test('only the page header opens add-task and column progress bars are removed', async () => {
  const tasksPageSource = await readFile(new URL('../src/app/(main)/tasks/page.tsx', import.meta.url), 'utf8');
  assert.match(tasksPageSource, /boardData\.columnOrder\[0\]/);
  assert.doesNotMatch(boardSource, /onAddTask/);
  assert.doesNotMatch(boardSource, /Tambah tugas di/);
  assert.doesNotMatch(boardSource, /progress:/);
  assert.doesNotMatch(boardSource, /animate=\{\{ width:/);
});

test('task loading copy stays understandable for end users', async () => {
  const tasksPageSource = await readFile(new URL('../src/app/(main)/tasks/page.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(tasksPageSource, /PostgreSQL|DATABASE_URL|OCR|Piper|Genkit|Gemini/);
  assert.match(tasksPageSource, /tasks-loading-hero/);
  assert.match(tasksPageSource, /tasks-loading-hero-chip/);
  assert.match(tasksPageSource, /tasks-loading-panel/);
  assert.match(tasksPageSource, /tasks-loading-orbit/);
  assert.match(tasksPageSource, /tasks-loading-track/);
  assert.match(tasksPageSource, /Perubahan tugas belum tersimpan/);
});

test('rich text descriptions stay readable outside the editor', () => {
  assert.match(descriptionHelper, /export function plainTaskDescription/);
  assert.match(boardSource, /plainTaskDescription\(task\.description\)/);
  assert.match(detailsSource, /plainTaskDescription\(currentTask\.description\)/);
});
