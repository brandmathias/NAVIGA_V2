# Photo Import Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow Gadaian and Angsuran Broadcast to extract eligible records from a local JPG, JPEG, PNG, or WEBP photo.

**Architecture:** The browser submits a photo to a server action. RapidDoc performs OCR only on the local machine, then each product reuses its existing parser and server-side unit-prefix filtering before any record reaches the browser.

**Tech Stack:** Next.js server actions, TypeScript, CommonJS parser utilities, RapidDoc local Python runtime, Node test runner.

## Global Constraints

- Accept only JPG, JPEG, PNG, and WEBP photos no larger than 10 MB.
- Do not call external OCR services or send messages automatically.
- Enforce session-derived unit scope on the server for every import route.
- Verify with normal Node tests and typecheck only; do not use browser testing.

---

### Task 1: Convert a photographed Angsuran table into import rows

**Files:**
- Create: `src/lib/installment-ocr-parser.js`
- Test: `tests/image-import.test.mjs`

**Interfaces:**
- Produces: `parseInstallmentOcrOutput(markdown): InstallmentCustomer[]`
- Consumes: `parseInstallmentRows(rows)` from `src/lib/installment-import.js`

- [ ] Write a failing test with a Markdown table containing the existing Angsuran headers and a five-digit SBG prefix.
- [ ] Run `rtk node --test tests/image-import.test.mjs` and verify it fails because the OCR parser does not exist.
- [ ] Parse pipe-table rows, ignore the separator row, and pass the resulting rows to `parseInstallmentRows`.
- [ ] Run the test again and verify it passes.

### Task 2: Add local photo OCR and server actions

**Files:**
- Modify: `src/lib/rapid-doc-client.js`
- Create: `src/lib/local-image-extractor.ts`
- Modify: `src/app/(main)/pdf-broadcast/actions.ts`
- Modify: `src/app/(main)/xlsx-broadcast/actions.ts`
- Test: `tests/image-import.test.mjs`

**Interfaces:**
- Produces: `extractImageMarkdown(image, filename): Promise<string>`, `parseGadaiImage(formData)`, and `parseInstallmentImage(formData)`.
- Consumes: the local `scripts/rapid-doc-extract.py` runner, existing Gadaian parser, existing Angsuran parser, and unit-prefix filters.

- [ ] Extend the local RapidDoc client to use a safe input filename, preserving its PDF behavior.
- [ ] Add a photo extractor with the same local timeout as PDF OCR.
- [ ] Validate a non-empty allowed image under 10 MB in each server action.
- [ ] Parse OCR output, reject empty/incomplete output, then filter by the authenticated unit prefix.
- [ ] Run focused tests and typecheck.

### Task 3: Expose photo import controls

**Files:**
- Modify: `src/app/(main)/pdf-broadcast/page.tsx`
- Modify: `src/app/(main)/xlsx-broadcast/page.tsx`
- Test: `tests/image-import.test.mjs`

**Interfaces:**
- Consumes: `parseGadaiImage(formData)` and `parseInstallmentImage(formData)`.

- [ ] Add an `Impor Foto` button and a hidden image file input to each screen.
- [ ] Use the existing loading, result reset, toast, and error patterns.
- [ ] State JPG, PNG, WEBP, and the 10 MB limit in the UI.
- [ ] Run focused tests, all import tests, typecheck, diff check, and graph update.
