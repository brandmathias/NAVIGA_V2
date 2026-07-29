# Lightweight Local PDF Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Chandra with a local, low-memory PDF path that preserves NAVIGA's Markdown-to-SBG parsing contract.

**Architecture:** The server action first uses OpenDataLoader's deterministic Java PDF parser for selectable-text documents. If its Markdown cannot form a complete gadai record, it runs the local RapidDoc CPU pipeline, whose OCR and table models use ONNX. Both paths produce Markdown for the existing parser and server-side UPC filter.

**Tech Stack:** Next.js 15, Node built-in tests, `@opendataloader/pdf`, Python 3.12, `rapid-doc[cpu]`, ONNX Runtime/OpenVINO.

## Global Constraints

- No cloud OCR, Gemini, Firebase, or Chandra dependency is used in the PDF import path.
- The document is processed only in a temporary local folder and is removed after extraction.
- The existing `parseGadaiOcrOutput` and session-derived UPC filter remain the authority for customer records.
- The default route must not download or load OCR models for a normal selectable-text PDF.
- Every new process boundary has a Node test that fails before its implementation.

### Task 1: Local RapidDoc process boundary

**Files:**
- Create: `tests/rapid-doc-client.test.mjs`
- Create: `src/lib/rapid-doc-client.js`

- [ ] Write a test that runs a temporary executable with a PDF buffer and proves the Markdown written to its output path is returned.
- [ ] Run `npm test -- tests/rapid-doc-client.test.mjs`; expected failure: the client module does not exist.
- [ ] Implement temporary input/output handling, timeout, empty-result detection, and cleanup in `extractRapidDocMarkdown`.
- [ ] Run the focused test; expected result: pass.

### Task 2: Two-stage local extractor

**Files:**
- Create: `src/lib/local-pdf-extractor.ts`
- Modify: `src/app/(main)/pdf-broadcast/actions.ts`
- Test: `tests/local-pdf-extractor.test.mjs`

- [ ] Write tests for a successful deterministic Markdown output and a RapidDoc fallback when it has no valid gadai record.
- [ ] Run the focused tests; expected failure: extractor functions do not exist.
- [ ] Implement OpenDataLoader conversion with images disabled and RapidDoc fallback only when parsing yields no complete record.
- [ ] Run the focused tests; expected result: pass.

### Task 3: Local setup and legacy removal

**Files:**
- Create: `scripts/setup-local-pdf.ps1`
- Create: `scripts/rapid-doc-extract.py`
- Modify: `README.md`
- Delete: `src/lib/chandra-client.ts`, `src/lib/chandra-timeout.js`, `src/lib/chandra-timeout.d.ts`, `scripts/setup-chandra.ps1`, `scripts/start-chandra.ps1`, `scripts/prepare-chandra-model.ps1`, and their obsolete tests.

- [ ] Add an idempotent setup script for Python's isolated RapidDoc environment and actionable Java 17 verification.
- [ ] Add the Python runner that writes only the generated Markdown to the requested temporary output path.
- [ ] Replace Chandra instructions in README with one local setup command and the actual prerequisites.
- [ ] Remove the unused Chandra runtime references.

### Task 4: Install and verify

**Files:** `package.json`, `package-lock.json`, all focused tests.

- [ ] Add `@opendataloader/pdf` and install the local CPU OCR environment.
- [ ] Run focused tests, all tests, type checking, production build, and a local PDF extraction smoke test.
- [ ] Update Graphify after source changes.
