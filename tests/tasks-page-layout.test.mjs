import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const boardSource = await readFile(new URL('../src/components/TaskKanbanBoard.tsx', import.meta.url), 'utf8');

test('task board uses a responsive grid instead of a horizontal scroller', () => {
  assert.match(boardSource, /grid/);
  assert.match(boardSource, /min-w-0/);
  assert.doesNotMatch(boardSource, /overflow-x-auto/);
});
