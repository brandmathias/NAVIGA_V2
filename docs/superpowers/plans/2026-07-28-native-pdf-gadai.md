# Native PDF Gadai Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the supplied digital Pegadaian reports locally and preserve Wanea/Ranotana server-side isolation.

**Architecture:** A `pypdf` runner emits layout-preserving text through a temporary-file Node client. The existing parser gains a Pegadaian layout adapter, and RapidDoc remains the scanned-PDF fallback.

**Tech Stack:** Next.js 15, Node.js, Python 3.12, pypdf 6, RapidDoc CPU, Node test runner.

## Global Constraints

- No Gemini, Firebase, Java, cloud OCR, or customer-data fixtures.
- Keep RapidDoc only as the scanned-PDF fallback.
- Preserve authenticated UPC filtering by SBG prefix.
- Remove every temporary customer-data file after processing.

---

### Task 1: Parse Pegadaian layout text

**Files:**
- Modify: `src/lib/gadai-ocr-parser.js`
- Test: `tests/gadai-ocr-parser.test.mjs`

**Interfaces:**
- Consumes: layout text produced by `PdfReader(...).extract_text(extraction_mode="layout")`.
- Produces: existing `parseGadaiOcrOutput(text): BroadcastCustomer[]` behavior.

- [x] Add a synthetic layout fixture containing wrapped names, address, phone, dates, collateral, and three amounts.
- [x] Run `node --test tests/gadai-ocr-parser.test.mjs` and confirm the layout assertion fails.
- [x] Add `parsePegadaianLayoutText` using record-start detection, fixed report column boundaries, date/phone validation, and existing `toCustomer` conversion.
- [x] Re-run the focused parser test and confirm it passes.

### Task 2: Add lightweight native PDF extraction

**Files:**
- Create: `scripts/pdf-text-extract.py`
- Create: `src/lib/native-pdf-client.js`
- Modify: `src/lib/local-pdf-extractor.ts`
- Test: `tests/native-pdf-client.test.mjs`
- Test: `tests/native-pdf-runner.test.mjs`

**Interfaces:**
- `pdf-text-extract.py <input.pdf> <output.txt>` writes pages separated by form feed.
- `extractNativePdfText(pdf, { command, args, timeoutMs }): Promise<string>` owns temporary files and cleanup.
- `extractGadaiMarkdown(pdf)` tries native extraction before `extractRapidDocMarkdown`.

- [x] Write failing client and runner tests using temporary synthetic inputs.
- [x] Run both focused tests and confirm missing runner/client failures.
- [x] Implement the runner, client, and extractor wiring with Indonesian errors and cleanup.
- [x] Re-run both focused tests and `tests/local-pdf-fallback.test.mjs`.

### Task 3: Remove Java extraction setup

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `scripts/setup-local-pdf.ps1`
- Modify: `README.md`

**Interfaces:**
- Setup explicitly installs `pypdf>=6,<7` with `rapid-doc[cpu]==0.9.9`.
- Runtime no longer imports `@opendataloader/pdf`.

- [x] Remove `@opendataloader/pdf` with npm so both package files stay synchronized.
- [x] Remove the Java warning and document native text extraction plus OCR fallback.
- [x] Run TypeScript checking to prove no stale package import remains.

### Task 4: Real-document and full verification

**Files:**
- Update generated graph: `graphify-out/`

**Interfaces:**
- Wanea output prefix: `11787` only.
- Ranotana output prefix: `11793` only.

- [x] Run native extraction and parser checks against all three supplied PDFs without printing customer details.
- [x] Assert record counts are non-zero, every record is complete, and every SBG prefix matches its UPC.
- [x] Run `npm test`, `npm run typecheck`, and `npm run build`.
- [x] Run `graphify update .` and delete diagnostic output under `tmp/pdfs/`.
