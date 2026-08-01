import assert from 'node:assert/strict';
import test from 'node:test';

import { MAX_TASK_ATTACHMENT_SIZE_BYTES, validateTaskAttachment } from '../src/lib/task-attachments.mjs';

test('accepts every file type within the 10 MB limit', () => {
  const result = validateTaskAttachment({
    name: 'kontrak.bin',
    size: MAX_TASK_ATTACHMENT_SIZE_BYTES,
    type: 'application/octet-stream',
  });

  assert.deepEqual(result, { valid: true });
});

test('rejects attachments larger than 10 MB with a user-facing message', () => {
  const result = validateTaskAttachment({
    name: 'video.mp4',
    size: MAX_TASK_ATTACHMENT_SIZE_BYTES + 1,
    type: 'video/mp4',
  });

  assert.equal(result.valid, false);
  assert.match(result.message, /10 MB/i);
});
