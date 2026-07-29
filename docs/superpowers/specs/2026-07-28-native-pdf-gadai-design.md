# Native PDF Gadai Extraction Design

## Goal

NAVIGA must extract Pegadaian maturity reports on the user's laptop without
Gemini, Firebase, Java, or a large language model. The supplied Wanea and
Ranotana reports must produce broadcast records and remain isolated by the
authenticated UPC.

## Evidence

The supplied PDFs contain selectable text on every page. Pypdf's layout mode
preserves the report columns, while RapidDoc turns the landscape table into a
reversed and merged HTML table that the current Markdown parser cannot use.

## Design

1. A small Python runner uses the already-installed `pypdf` package and writes
   layout-preserving text. It never sends the document or extracted data over
   the network.
2. A Node client owns the temporary input/output files, timeout, errors, and
   guaranteed cleanup.
3. The gadai parser recognizes the fixed Pegadaian layout in addition to its
   existing Markdown and key-value formats. It extracts SBG, rubric, customer,
   phone, dates, collateral, amounts, and address by report-column boundaries.
4. The native text path is attempted first. RapidDoc remains a fallback only
   when native text contains no complete record, which covers scanned PDFs.
5. Server-side UPC filtering remains unchanged: prefix `11787` is Wanea and
   `11793` is Ranotana.

## Error Handling and Privacy

- Empty, corrupt, and encrypted PDFs return an Indonesian extraction error.
- Native extraction has a short bounded timeout; RapidDoc retains its longer
  OCR timeout.
- All temporary PDF and text files are removed in `finally` blocks.
- Tests use synthetic customer data. Supplied customer documents are used only
  for local integration checks and are not copied into the repository.

## Success Criteria

- The one-page and full Wanea documents produce only `11787` records.
- The Ranotana document produces only `11793` records.
- Every returned record has SBG, customer name, due date, and a valid Indonesian
  mobile number.
- Native digital-PDF extraction does not start RapidDoc.
- Existing unit tests, TypeScript checking, and the production build pass.
