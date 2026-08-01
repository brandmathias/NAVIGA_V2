# PostgreSQL Task Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist the Lacak Tugas board in PostgreSQL so task changes survive refreshes and remain isolated by the authenticated user scope.

**Architecture:** A protected `/api/tasks` route derives the board scope from the server session, reads and writes one validated JSONB board document, and uses an optimistic version number to reject stale writes. The client loads from the API, sends debounced board changes, and performs a one-time migration from the old browser key when the database has no board yet.

**Tech Stack:** Next.js 15 App Router route handler, node-postgres (`pg`), PostgreSQL JSONB, TypeScript, Node test runner.

## Global Constraints

- Do not modify the existing header or sidebar.
- Do not trust a client-provided unit/scope identifier.
- Reject malformed board data and task attachments over 10 MB at the API boundary.
- Do not claim live database verification unless `DATABASE_URL` is configured and the route is exercised.

---

### Task 1: Board validation contract

**Files:**
- Create: `src/lib/task-board-validation.mjs`
- Test: `tests/task-board-validation.test.mjs`

**Interfaces:**
- Produces `validateTaskBoardData(value)` returning `{ valid: true }` or `{ valid: false, message }`.

- [x] **Step 1: Write the failing test**

Test a valid board, duplicate task placement, and an attachment above 10 MB.

- [x] **Step 2: Run the focused test and confirm it fails**

Run `node --test tests/task-board-validation.test.mjs` and confirm the missing validator causes failure.

- [x] **Step 3: Implement the validator**

Validate board shape, task references, bounded strings, and attachment metadata without importing client code.

- [x] **Step 4: Run the focused test and confirm it passes**

Run `node --test tests/task-board-validation.test.mjs`.

### Task 2: PostgreSQL repository and migration

**Files:**
- Modify: `package.json`, `package-lock.json`
- Create: `db/migrations/001_create_naviga_task_boards.sql`
- Create: `src/lib/postgres.ts`
- Create: `src/lib/task-board-defaults.ts`
- Create: `src/lib/task-board-repository.ts`

**Interfaces:**
- `getTaskBoard(scopeKey)` returns `{ boardData, version, updatedAt }`.
- `saveTaskBoard(scopeKey, boardData, expectedVersion)` returns the saved board and new version.
- `scopeForSession(session)` derives `global:superadmin` or `unit:<unitId>`.

- [x] **Step 1: Add `pg` and its type definitions**
- [x] **Step 2: Add the idempotent PostgreSQL schema**
- [x] **Step 3: Add a lazy pooled connection and repository functions**
- [x] **Step 4: Keep missing `DATABASE_URL` as a clear runtime 503, not a build-time failure**

### Task 3: Protected tasks API

**Files:**
- Create: `src/app/api/tasks/route.ts`
- Test: `tests/task-api-contract.test.mjs`

**Interfaces:**
- `GET /api/tasks` reads the current session scope.
- `PUT /api/tasks` accepts `{ boardData, version }` and returns `409` on stale versions.

- [x] **Step 1: Write the route contract test**
- [x] **Step 2: Implement session checks, validation, repository calls, and error statuses**
- [x] **Step 3: Run the focused route contract test**

### Task 4: Replace client-only persistence

**Files:**
- Modify: `src/app/(main)/tasks/page.tsx`

- [x] **Step 1: Load the board from `/api/tasks` before enabling edits**
- [x] **Step 2: Migrate one valid legacy localStorage board when the database is empty**
- [x] **Step 3: Debounce and queue board saves with the returned version**
- [x] **Step 4: Surface load/sync failures instead of silently restoring defaults**

### Task 5: Verification

- [x] Run focused validation and API contract tests.
- [x] Run `npm run typecheck`.
- [x] Run `npm test`.
- [x] Run `npm run build` after stopping only the project dev server if it locks `.next`.
- [x] Run `graphify update .`.
- [ ] Exercise authenticated `GET` and `PUT` against PostgreSQL after `DATABASE_URL` and the database credentials are supplied; the local server currently rejects passwordless access.
