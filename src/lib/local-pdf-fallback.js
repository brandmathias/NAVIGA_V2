async function extractPreferredPdfMarkdown(pdf, { extractDigital, extractOcr, isUsable }) {
  try {
    const markdown = await extractDigital(pdf);
    if (isUsable(markdown)) return markdown;
  } catch {
    // The OCR path is the local fallback for scanned PDFs and unavailable Java extraction.
  }

  return extractOcr(pdf);
}

module.exports = { extractPreferredPdfMarkdown };
