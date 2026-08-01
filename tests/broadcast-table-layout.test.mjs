import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('broadcast result tables preserve readable columns without clipping extracted data', async () => {
  const [pdfPage, xlsxPage] = await Promise.all([
    readFile('src/app/(main)/pdf-broadcast/page.tsx', 'utf8'),
    readFile('src/app/(main)/xlsx-broadcast/page.tsx', 'utf8'),
  ]);

  for (const page of [pdfPage, xlsxPage]) {
    assert.match(page, /w-full table-fixed/);
    assert.match(page, /break-words/);
    assert.match(page, /min-w-0/);
    assert.match(page, /font-variant-numeric:tabular-nums/);
    assert.match(page, /aria-label=/);
    assert.doesNotMatch(page, /!w-\[/);
    assert.doesNotMatch(page, /sticky right-0/);
  }

  assert.match(pdfPage, /Nasabah &amp; SBG/);
  assert.match(pdfPage, /Nilai Gadai/);
  assert.match(pdfPage, /Kontak &amp; Alamat/);
  assert.doesNotMatch(pdfPage, />SBG \{customer\.sbg_number\}</);
  assert.match(xlsxPage, /Nasabah &amp; Produk/);
  assert.match(xlsxPage, /Nilai &amp; Status/);

  const sidebarInset = await readFile('src/components/ui/sidebar.tsx', 'utf8');
  assert.match(sidebarInset, /min-h-svh min-w-0 flex-1/);
});
