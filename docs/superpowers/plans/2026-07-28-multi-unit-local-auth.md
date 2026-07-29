# Multi-Unit Local Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace one-account local login with persistent Superadmin-managed unit accounts and server-side prefix scopes.

**Architecture:** A local JSON registry stores only salted password hashes and active units. Sessions carry role and unit prefix; PDF and XLSX server actions apply that prefix before returning records. A Superadmin-only page creates future unit/account pairs.

**Tech Stack:** Next.js 15, Node.js `fs/promises`, Node.js `crypto.scryptSync`, React, XLSX, Node test runner.

## Global Constraints

- No Firebase, external database, cloud authentication, or cloud OCR.
- Prefixes are exactly five numeric digits and unique across active units.
- Unit scope is derived server-side from the signed session, never from a browser-provided UPC value.
- Passwords are salted hashes in `.naviga/unit-registry.json`; bootstrap values are in ignored `.env.local` only.
- Garuda remains unregistered until its code is known.

---

### Task 1: Persistent account and unit registry

**Files:**
- Create: `src/lib/unit-registry.js`
- Modify: `src/lib/local-auth.js`
- Modify: `src/lib/local-auth.d.ts`
- Test: `tests/unit-registry.test.mjs`
- Test: `tests/local-auth.test.mjs`

**Interfaces:**
- `authenticateLocalUser(email, password): Promise<LocalUser | null>`.
- `registerUnit({ name, prefix, email, password }): Promise<PublicUnit>`.
- `listUnits(): Promise<PublicUnit[]>`.
- `LocalSession` includes `role`, `unitId`, `unitName`, and `unitPrefix`.

- [x] Write a failing registry test that authenticates Wanea and Superadmin, verifies a salted hash is stored, and rejects a duplicate prefix.
- [x] Run `node --test tests/unit-registry.test.mjs` and confirm it fails because the registry module is absent.
- [x] Implement the local registry, bootstrap validation, and signed role-aware sessions.
- [x] Re-run focused registry and local-auth tests until they pass.

### Task 2: Dynamic server-side record scope

**Files:**
- Modify: `src/lib/gadai-ocr-parser.js`
- Modify: `src/lib/installment-import.js`
- Modify: `src/app/(main)/pdf-broadcast/actions.ts`
- Create: `src/app/(main)/xlsx-broadcast/actions.ts`
- Modify: `src/app/(main)/xlsx-broadcast/page.tsx`
- Modify: `src/types/index.ts`
- Test: `tests/gadai-ocr-parser.test.mjs`
- Test: `tests/installment-import.test.mjs`

**Interfaces:**
- `filterGadaiCustomersByPrefix(customers, prefix)` returns only matching SBG rows.
- `filterInstallmentCustomersByPrefix(customers, prefix)` returns only matching identifier rows.
- `parseXlsx(formData)` requires the session and returns only active scoped rows.

- [x] Write failing tests for an arbitrary registered prefix and for an XLSX identifier column.
- [x] Run the focused parser tests and confirm the dynamic-scope assertions fail.
- [x] Implement prefix extraction, server-side XLSX parsing, and active-unit filtering.
- [x] Re-run focused parser tests until they pass.

### Task 3: Superadmin registration screen

**Files:**
- Create: `src/app/(main)/unit-management/actions.ts`
- Create: `src/app/(main)/unit-management/page.tsx`
- Create: `src/app/(main)/unit-management/unit-management-client.tsx`
- Modify: `src/components/main-shell.tsx`
- Modify: `src/app/(main)/profile/page.tsx`
- Test: `tests/session-scope-pages.test.mjs`

**Interfaces:**
- `createUnitAccount(formData)` requires `session.role === 'superadmin'`.
- `UnitManagementClient` receives `PublicUnit[]` and refreshes after creation.

- [x] Write a failing structural test that requires a Superadmin-only management route and navigation entry.
- [x] Run `node --test tests/session-scope-pages.test.mjs` and confirm it fails.
- [x] Implement the protected form, unit list, server action, navigation, and role display.
- [x] Re-run focused UI/session tests until they pass.

### Task 4: Bootstrap configuration and verification

**Files:**
- Create: `.env.local`
- Modify: `README.md`
- Test: `tests/e2e_local_login.py`

**Interfaces:**
- Initial accounts: Superadmin, Wanea (`11787`), Ranotana (`11793`).
- Garuda is created only through `/unit-management` after a prefix is supplied.

- [x] Generate the ignored local bootstrap configuration with the requested Wanea/Ranotana credentials and a one-time Superadmin password.
- [x] Update the local runbook without embedding passwords in tracked documentation.
- [x] Run focused tests, full `npm test`, `npm run typecheck`, browser login checks, and `npm run build`.
- [x] Run `graphify update .`, then confirm `.naviga/unit-registry.json` is ignored and contains no plaintext passwords.
