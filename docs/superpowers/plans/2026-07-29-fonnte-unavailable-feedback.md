# Fonnte Unavailable Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a clear, safe Fonnte setup message instead of a masked production server-action error when Fonnte is disabled.

**Architecture:** The server-only Fonnte adapter returns a typed unavailable result before any external request. Both broadcast clients consume that result and stop before history writes or success notifications.

**Tech Stack:** Next.js server actions, React, Node built-in test runner, TypeScript declarations.

## Global Constraints

- Never expose `FONNTE_TOKEN` to the browser.
- A disabled Fonnte configuration must make zero network calls.
- Preserve unit-prefix validation and the 60-second Fonnte delay.

---

### Task 1: Return an explicit unavailable result

**Files:**
- Modify: `tests/fonnte-client.test.mjs`
- Modify: `src/lib/fonnte-client.js`
- Modify: `src/lib/fonnte-client.d.ts`
- Modify: `src/lib/broadcast-queue.d.ts`

**Interfaces:**
- Produces: `FonnteQueueResult = { accepted: number; reference?: string; unavailable?: true }`.

- [ ] **Step 1: Write the failing test**

```js
const result = await queueFonnteMessages({ recipients: [{ target: '6281234567890', message: 'Halo' }] });
assert.deepEqual(result, { accepted: 0, unavailable: true });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/fonnte-client.test.mjs`

Expected: the disabled-configuration test fails because the adapter throws.

- [ ] **Step 3: Write minimal implementation**

```js
if (!getFonnteStatus().enabled) return { accepted: 0, unavailable: true };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/fonnte-client.test.mjs`

Expected: all Fonnte adapter tests pass.

### Task 2: Surface the unavailable result in both broadcast pages

**Files:**
- Modify: `src/app/(main)/pdf-broadcast/page.tsx`
- Modify: `src/app/(main)/xlsx-broadcast/page.tsx`
- Test: `tests/e2e_pdf_upload.py`
- Test: `tests/e2e_xlsx_upload.py`

**Interfaces:**
- Consumes: `QueueResult.unavailable?: true` from Task 1.

- [ ] **Step 1: Handle unavailable before success behavior**

```ts
if (result.unavailable) {
  toast({ title: 'Fonnte Belum Aktif', description: 'Konfigurasikan FONNTE_ENABLED=true dan FONNTE_TOKEN di server sebelum mengantrekan pesan.', variant: 'destructive' });
  return;
}
```

- [ ] **Step 2: Verify no success history is written for an unavailable result**

Run: `python tests/e2e_pdf_upload.py` and `python tests/e2e_xlsx_upload.py` with `FONNTE_ENABLED` not set.

Expected: imports remain successful and no Fonnte request is made.

- [ ] **Step 3: Type-check and build**

Run: `npm run typecheck` and `npm run build`.

Expected: both complete successfully.
