import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const preview = readFileSync(new URL('../src/components/TaskAttachmentPreview.tsx', import.meta.url), 'utf8');
const addTaskDialog = readFileSync(new URL('../src/components/AddTaskDialog.tsx', import.meta.url), 'utf8');
const taskDetailsDialog = readFileSync(new URL('../src/components/TaskDetailsDialog.tsx', import.meta.url), 'utf8');

test('shared attachment preview resolves stored files and releases object URLs', () => {
  assert.match(preview, /getTaskAttachment/);
  assert.match(preview, /URL\.createObjectURL/);
  assert.match(preview, /URL\.revokeObjectURL/);
  assert.match(preview, /image\//);
  assert.match(preview, /video\//);
  assert.match(preview, /audio\//);
  assert.match(preview, /application\/pdf/);
});

test('add task keeps selected file previews visible before submit', () => {
  assert.match(addTaskDialog, /TaskAttachmentPreview/);
  assert.match(addTaskDialog, /file=\{file\}/);
});

test('task details keeps stored attachment previews visible inline', () => {
  assert.match(taskDetailsDialog, /TaskAttachmentPreview/);
  assert.match(taskDetailsDialog, /attachments\.map/);
});

test('attachment selection stays compact with a bounded vertical list', () => {
  assert.match(preview, /compact \? 'h-16 w-20/);
  assert.match(addTaskDialog, /max-h-48/);
  assert.match(addTaskDialog, /space-y-2/);
  assert.doesNotMatch(addTaskDialog, /sm:grid-cols-2/);
});
