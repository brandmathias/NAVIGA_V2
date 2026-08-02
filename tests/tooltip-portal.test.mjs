import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const tooltipSource = await readFile(new URL('../src/components/ui/tooltip.tsx', import.meta.url), 'utf8');

test('tooltip content is portaled outside clipped card containers', () => {
  assert.match(tooltipSource, /TooltipPrimitive\.Portal/);
});
