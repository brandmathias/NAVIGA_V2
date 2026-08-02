import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const addTaskDialog = readFileSync(new URL('../src/components/AddTaskDialog.tsx', import.meta.url), 'utf8');
const taskTypes = readFileSync(new URL('../src/types/index.ts', import.meta.url), 'utf8');

test('add task modal exposes the reference fields and upload flow', () => {
  assert.match(addTaskDialog, /DialogTitle/);
  assert.match(addTaskDialog, /DialogDescription/);
  assert.match(addTaskDialog, /Batas Waktu/);
  assert.match(addTaskDialog, /Prioritas/);
  assert.match(addTaskDialog, /Penting/);
  assert.match(addTaskDialog, /Sedang/);
  assert.match(addTaskDialog, /Rendah/);
  assert.match(addTaskDialog, /Upload File/);
  assert.match(addTaskDialog, /maksimal 10 MB per file/i);
  assert.match(addTaskDialog, /multiple/);
});

test('task type can persist multiple attachments', () => {
  assert.match(taskTypes, /attachments\?\s*:\s*TaskAttachment\[\]/);
});

test('add task modal stays compact and toolbar edits the description', () => {
  assert.match(addTaskDialog, /max-w-\[960px\]/);
  assert.match(addTaskDialog, /md:grid-cols-2/);
  assert.match(addTaskDialog, /contentEditable=\{true\}/);
  assert.match(addTaskDialog, /document\.execCommand/);
  assert.match(addTaskDialog, /onMouseDown=\{\(event\) => event\.preventDefault\(\)\}/);
  assert.match(addTaskDialog, /runEditorCommand\(command\)/);
});
