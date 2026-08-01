import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const boardSource = await readFile(new URL('../src/components/TaskKanbanBoard.tsx', import.meta.url), 'utf8');

test('task columns use icons that match todo, in-progress, and done semantics', () => {
  assert.match(boardSource, /const columnIcons = \[\s*ListTodo,\s*LoaderCircle,\s*CircleCheckBig,/s);
});
