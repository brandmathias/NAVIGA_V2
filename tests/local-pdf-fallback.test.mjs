import assert from 'node:assert/strict';
import test from 'node:test';

const validGadaiMarkdown = `
| No. SBG | Nama Nasabah | No. HP | Jatuh Tempo |
| --- | --- | --- | --- |
| 117870123456 | Siti Aminah | 081234567890 | 01/09/2026 |
`;

test('keeps deterministic PDF Markdown when it produces a complete gadai record', async () => {
  const { extractPreferredPdfMarkdown } = await import('../src/lib/local-pdf-fallback.js');
  let ocrStarted = false;

  const markdown = await extractPreferredPdfMarkdown(Buffer.from('%PDF-1.7'), {
    extractDigital: async () => validGadaiMarkdown,
    extractOcr: async () => {
      ocrStarted = true;
      return 'OCR Markdown';
    },
    isUsable: (value) => value.includes('117870123456'),
  });

  assert.equal(markdown, validGadaiMarkdown);
  assert.equal(ocrStarted, false);
});

test('uses local OCR when deterministic PDF Markdown has no complete gadai record', async () => {
  const { extractPreferredPdfMarkdown } = await import('../src/lib/local-pdf-fallback.js');

  const markdown = await extractPreferredPdfMarkdown(Buffer.from('%PDF-1.7'), {
    extractDigital: async () => '| No. SBG | Nama Nasabah |\n| --- | --- |\n| 117870123456 | Siti Aminah |',
    extractOcr: async () => validGadaiMarkdown,
    isUsable: (value) => value.includes('081234567890'),
  });

  assert.equal(markdown, validGadaiMarkdown);
});
