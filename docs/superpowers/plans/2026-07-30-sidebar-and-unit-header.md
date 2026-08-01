# Sidebar & Header Unit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give NAVIGA a compact reference-faithful sidebar and role-specific top-header copy without changing navigation or session data.

**Architecture:** Keep `src/components/main-shell.tsx` as the shell owner. Add only scoped visual classes there and a dedicated CSS module for the reference sidebar; derive header copy directly from the existing `LocalSession` passed to the shell.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, CSS Modules, Node test runner.

## Global Constraints

- Reuse the existing logo, routes, sidebar primitive, broadcast dropdown, and role-gated Manajemen Unit entry.
- Desktop sidebar width is 292 px; the brand panel is 100 px high, menu cards are 56 px high, labels do not use ellipsis, and all text uses Plus Jakarta Sans.
- User account content must truncate safely and retain keyboard-visible focus.
- Unit header copy must not present Superadmin-wide management claims.
- Do not use a browser for verification.

---

### Task 1: Protect the intended shell presentation

**Files:**

- Modify: `tests/main-header-visual.test.mjs`
- Modify: `src/components/main-shell.tsx`

**Interfaces:**

- Consumes: `LocalSession.role`, `LocalSession.unitName`, existing `Sidebar` and `SidebarMenuButton`.
- Produces: role-aware header content and stable semantic sidebar hooks.

- [ ] **Step 1: Write the failing test**

```js
assert.match(shell, /user\\.role === 'unit'/);
assert.match(shell, /Operations Center/);
assert.match(shell, /naviga-sidebar-brand/);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/main-header-visual.test.mjs`

Expected: FAIL because role-specific copy and the sidebar brand hook are absent.

- [ ] **Step 3: Write minimal implementation**

```tsx
const isUnitUser = user.role === 'unit';
const headerTitle = isUnitUser
  ? `${user.unitName || 'NAVIGA Unit'} Operations Center`
  : 'NAVIGA Control Center';
```

Apply the same visual hook to the existing sidebar elements rather than replacing routing or the sidebar primitive.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/main-header-visual.test.mjs`

Expected: PASS.

### Task 2: Scope sidebar reference styling

**Files:**

- Create: `src/components/main-shell.module.css`
- Modify: `src/components/main-shell.tsx`
- Test: `tests/main-header-visual.test.mjs`

**Interfaces:**

- Consumes: class hooks from Task 1.
- Produces: sidebar visual tokens, reduced-motion fallback, and responsive-safe spacing.

- [ ] **Step 1: Write the failing test**

```js
assert.match(shellStyles, /@media \\(prefers-reduced-motion: reduce\\)/);
assert.match(shellStyles, /naviga-sidebar-menu-button/);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/main-header-visual.test.mjs`

Expected: FAIL because the scoped shell stylesheet is absent.

- [ ] **Step 3: Write minimal implementation**

```css
.naviga-sidebar-menu-button {
  transition: transform 180ms cubic-bezier(.23,1,.32,1), background-color 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}
```

Use a white-to-mint brand treatment, a teal selected state, and focus-visible styling. Keep movement at 1 px or less and turn it off under reduced motion.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/main-header-visual.test.mjs`

Expected: PASS.

### Task 3: Verify and ship only task files

**Files:**

- Modify: `docs/superpowers/specs/2026-07-30-sidebar-and-unit-header-design.md`
- Modify: `docs/superpowers/plans/2026-07-30-sidebar-and-unit-header.md`
- Modify: `src/components/main-shell.tsx`
- Create: `src/components/main-shell.module.css`
- Modify: `tests/main-header-visual.test.mjs`

**Interfaces:**

- Consumes: completed shell classes and role-aware copy.
- Produces: verified, isolated commit.

- [ ] **Step 1: Run focused test**

Run: `node --test tests/main-header-visual.test.mjs`

Expected: PASS.

- [ ] **Step 2: Run static safety checks**

Run: `npm run typecheck; npm test; rtk graphify update .`

Expected: each command exits successfully.

- [ ] **Step 3: Audit the changed shell**

Run: review `src/components/main-shell.tsx` and `src/components/main-shell.module.css` against current Web Interface Guidelines.

Expected: no critical accessibility, interaction, or motion issue remains.

- [ ] **Step 4: Commit and push**

```bash
git add docs/superpowers/specs/2026-07-30-sidebar-and-unit-header-design.md docs/superpowers/plans/2026-07-30-sidebar-and-unit-header.md src/components/main-shell.tsx src/components/main-shell.module.css tests/main-header-visual.test.mjs
git commit -m "feat: refine NAVIGA sidebar and unit header"
git push origin main
```

### Task 4: Prevent the post-login refresh

**Files:**

- Create: `tests/login-navigation.test.mjs`
- Modify: `src/app/login/page.tsx`

**Interfaces:**

- Consumes: successful `POST /api/auth/login` responses that set the session cookie.
- Produces: a single client-side route replacement to `/dashboard`.

- [ ] **Step 1: Write the failing test**

```js
assert.match(successFlow, /router\.replace\('\/dashboard'\)/);
assert.doesNotMatch(successFlow, /router\.refresh\(\)/);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/login-navigation.test.mjs`

Expected: FAIL because the current success flow invokes `router.refresh()` after redirecting.

- [ ] **Step 3: Write minimal implementation**

```tsx
router.replace('/dashboard');
```

Remove only the immediate `router.refresh()` in the successful login branch.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/login-navigation.test.mjs`

Expected: PASS.
