# NAVIGA Local Chandra and Piper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove Firebase and Google Gemini dependencies while keeping NAVIGA testable locally through signed local login, Chandra OCR for PDF gadai, deterministic XLSX import, and Piper TTS.

**Architecture:** Browser pages use server actions only after a signed HttpOnly local session is established. PDF files are sent to a local Chandra adapter and reviewed as parsed records; XLSX remains a direct cell parser because Chandra does not accept XLSX. Piper is a local HTTP service that returns WAV bytes, which the existing preview dialog consumes as a data URI.

**Tech Stack:** Next.js 15, TypeScript, Node built-in tests, SheetJS, local Python Chandra runtime, Piper HTTP service.

## Global Constraints

- No Firebase, Genkit, Gemini, or Google API imports/configuration remain in the source or package dependencies.
- Authentication and UPC scope are derived on the server from an HttpOnly signed cookie; browser storage is never trusted for authorization.
- OCR and TTS services are bound to localhost and must return clear, actionable local errors when unavailable.
- XLSX import is direct SheetJS parsing, with deterministic Indonesian number/header handling; it is not converted to OCR.
- WhatsApp actions remain user-initiated browser actions; the app must not claim delivery just because a tab opened.
- All new parsing and service boundary behavior has an automated Node test that fails before the corresponding implementation.

### Task 1: Local session and route guards

**Files:** `src/lib/local-auth.ts`, `src/app/login/page.tsx`, `src/app/(main)/layout.tsx`, local API/session files, tests.

- [ ] Test token creation/verification, invalid credentials, and UPC scope.
- [ ] Implement server-only demo credentials from environment defaults and signed cookie issuance/removal.
- [ ] Guard all main routes and server actions with the verified session.

### Task 2: Chandra PDF extraction boundary

**Files:** OCR adapter/service, `src/lib/gadai-ocr-parser.js`, `src/app/(main)/pdf-broadcast/actions.ts`, setup script, tests.

- [ ] Test parsing of Chandra Markdown tables/key-value output, malformed output, and missing required fields.
- [ ] Implement adapter with timeout, temporary-file cleanup, and explicit unavailable-service errors.
- [ ] Map valid OCR result to `BroadcastCustomer` and apply session-derived UPC filtering.

### Task 3: XLSX deterministic import

**Files:** `src/lib/installment-import.js`, `src/app/(main)/xlsx-broadcast/page.tsx`, tests.

- [ ] Test header skipping, Indonesian numeric values, blank rows, and UPC filtering.
- [ ] Replace page-local positional parsing with the tested helper.

### Task 4: Piper voice service boundary

**Files:** `src/lib/piper-tts.js`, local TTS action, broadcast pages, setup/start scripts, tests.

- [ ] Test WAV success, unavailable service, bad response, and timeout with a local HTTP test server.
- [ ] Implement Piper HTTP client returning a WAV data URI and preserve preview/download behavior.
- [ ] Provide reproducible Windows setup commands for the Indonesian Piper voice.

### Task 5: Legacy removal and verification

**Files:** package/config/docs/obsolete Genkit and Firebase files, tests.

- [ ] Remove obsolete Firebase/Genkit dependencies, flows, config, documentation, and type errors.
- [ ] Reinstall Windows dependencies, execute unit/type/build checks, run browser smoke tests, and update Graphify.
