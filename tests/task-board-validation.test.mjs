import test from 'node:test';
import assert from 'node:assert/strict';
import { validateTaskBoardData } from '../src/lib/task-board-validation.mjs';

const validBoard = {
  tasks: {
    'task-1': {
      id: 'task-1',
      title: 'Analisis data penjualan Q2',
      description: 'Ringkasan eksekutif.',
      labels: ['Penting'],
      attachment: { id: 'attachment-1', name: 'laporan.pdf', type: 'application/pdf', size: 1024 },
    },
  },
  columns: {
    'column-1': { id: 'column-1', title: 'Daftar Tugas', taskIds: ['task-1'] },
  },
  columnOrder: ['column-1'],
};

test('accepts a well-formed task board', () => {
  assert.deepEqual(validateTaskBoardData(validBoard), { valid: true });
});

test('rejects a task referenced more than once', () => {
  const board = structuredClone(validBoard);
  board.columns['column-2'] = { id: 'column-2', title: 'Selesai', taskIds: ['task-1'] };
  board.columnOrder.push('column-2');

  const result = validateTaskBoardData(board);

  assert.equal(result.valid, false);
  assert.match(result.message, /tepat satu kolom/i);
});

test('rejects attachments larger than 10 MB', () => {
  const board = structuredClone(validBoard);
  board.tasks['task-1'].attachment.size = 10 * 1024 * 1024 + 1;

  const result = validateTaskBoardData(board);

  assert.equal(result.valid, false);
  assert.match(result.message, /10 MB/i);
});
