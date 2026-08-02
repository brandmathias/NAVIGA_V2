import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const boardSource = await readFile(new URL('../src/components/TaskKanbanBoard.tsx', import.meta.url), 'utf8');
const detailsSource = await readFile(new URL('../src/components/TaskDetailsDialog.tsx', import.meta.url), 'utf8');
const addTaskSource = await readFile(new URL('../src/components/AddTaskDialog.tsx', import.meta.url), 'utf8');
const dialogConfigSource = await readFile(new URL('../src/components/task-dialog-config.ts', import.meta.url), 'utf8').catch(() => '');
const descriptionHelper = await readFile(new URL('../src/lib/task-description.ts', import.meta.url), 'utf8').catch(() => '');

test('task board keeps columns in one horizontally scrollable row', () => {
  assert.match(boardSource, /grid/);
  assert.match(boardSource, /min-w-0/);
  assert.match(boardSource, /grid-flow-col/);
  assert.match(boardSource, /overflow-x-auto/);
  assert.match(boardSource, /auto-cols-\[minmax\(280px,1fr\)\]/);
  assert.doesNotMatch(boardSource, /2xl:grid-cols-4/);
});

test('add-column card submits from its visible plus button', () => {
  assert.match(boardSource, /Tambah kolom/);
  assert.match(boardSource, /aria-label="Tambah kolom"/);
  assert.match(boardSource, /onClick=\{submitNewColumn\}/);
  assert.match(boardSource, /onSubmit=\{handleAddColumn\}/);
  assert.match(boardSource, /document\.getElementById\('new-column-title'\)\?\.focus\(\)/);
});

test('task header keeps column creation inside the add-column card', async () => {
  const tasksPageSource = await readFile(new URL('../src/app/(main)/tasks/page.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(tasksPageSource, /Tambah Kolom<\/Button>/);
  assert.match(tasksPageSource, /onAddColumn=\{handleAddColumn\}/);
  assert.match(boardSource, /id="new-column-title"/);
  assert.match(boardSource, /onSubmit=\{handleAddColumn\}/);
});

test('column cards expose a safe delete action in their footer', async () => {
  const tasksPageSource = await readFile(new URL('../src/app/(main)/tasks/page.tsx', import.meta.url), 'utf8');
  assert.match(boardSource, /onDeleteColumn: \(columnId: string\) => void/);
  assert.match(boardSource, /Trash2/);
  assert.match(boardSource, /Hapus kolom/);
  assert.match(boardSource, /canDeleteColumn/);
  assert.match(boardSource, /onDeleteColumn\(column\.id\)/);
  assert.match(boardSource, /disabled:opacity-100/);
  assert.match(tasksPageSource, /onDeleteColumn=\{handleDeleteColumn\}/);
  assert.match(tasksPageSource, /column\.taskIds\.length > 0/);
  assert.match(tasksPageSource, /previous\.columnOrder\.length <= 1/);
  assert.match(tasksPageSource, /columnOrder: previous\.columnOrder\.filter/);
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

test('task detail dialog keeps actions visible while its content scrolls', () => {
  assert.match(detailsSource, /DialogContent className="[^"]*flex[^\"]*flex-col[^\"]*overflow-hidden/);
  assert.match(detailsSource, /DialogHeader className="[^"]*shrink-0/);
  assert.match(detailsSource, /className="[^\"]*min-h-0[^\"]*flex-1[^\"]*overflow-y-auto/);
  assert.match(detailsSource, /DialogFooter className="[^"]*shrink-0/);
  assert.match(detailsSource, /Hapus Tugas/);
  assert.match(detailsSource, /Simpan & Tutup/);
});

test('task detail editor stays synchronized with add-task controls', () => {
  assert.match(detailsSource, /id="detail-title"[\s\S]*className="[^\"]*h-8[^\"]*min-h-8[^\"]*relative[^\"]*z-\[1\]/);
  assert.match(addTaskSource, /TASK_PRIORITY_OPTIONS/);
  assert.match(detailsSource, /TASK_PRIORITY_OPTIONS/);
  assert.match(dialogConfigSource, /selected: 'border-\[#ff7a72\] bg-\[#ffe8e7\] text-\[#ff4038\]/);
  assert.match(dialogConfigSource, /selected: 'border-\[#ffb34f\] bg-\[#fff1d9\] text-\[#f08b00\]/);
  assert.match(dialogConfigSource, /selected: 'border-\[#f0c65a\] bg-\[#fff5d8\] text-\[#d79e00\]/);
  assert.match(detailsSource, /option\.selected/);
  assert.match(addTaskSource, /Maximize2/);
  assert.match(detailsSource, /Maximize2/);
  assert.match(detailsSource, /contentEditable=\{true\}/);
  assert.match(detailsSource, /document\.execCommand/);
  assert.match(detailsSource, /setIsEditorExpanded/);
  assert.match(detailsSource, /editorTaskIdRef/);
  assert.match(detailsSource, /lastEditorValueRef/);
});
