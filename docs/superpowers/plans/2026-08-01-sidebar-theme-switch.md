# Sidebar Theme Switch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent, accessible light/dark theme switch immediately above the sidebar account card.

**Architecture:** A small client-only `ThemeSwitch` owns the browser preference and toggles the existing root `.dark` token class. `MainShell` places it in the shared sidebar footer, while scoped CSS makes the shell and switch use the NAVIGA palette in both themes.

**Tech Stack:** Next.js 15, React 18, Tailwind CSS 3, Radix Switch, Lucide icons, Node test runner.

## Global Constraints

- Do not add dependencies; Radix Switch and Lucide are already installed.
- Persist the explicit preference in `localStorage` under `naviga-theme`.
- Use `prefers-color-scheme` only when no explicit preference exists.
- Respect `prefers-reduced-motion`; motion may only animate transform, opacity, color, and shadow.
- Keep the toggle touch target at least 44 px and avoid browser automation.

---

### Task 1: Theme-switch regression contract

**Files:**
- Create: `tests/sidebar-theme-switch.test.mjs`

**Interfaces:**
- Consumes: `src/components/theme-switch.tsx`
- Produces: static regression coverage for preference persistence, accessibility, and the sidebar placement hook.

- [ ] **Step 1: Write the failing test**

```js
test('theme switch persists a browser preference and exposes an accessible checkbox', async () => {
  const source = await readFile('src/components/theme-switch.tsx', 'utf8');
  assert.match(source, /localStorage\.setItem\('naviga-theme'/);
  assert.match(source, /role="switch"/);
  assert.match(source, /aria-label="Aktifkan mode gelap"/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/sidebar-theme-switch.test.mjs`

Expected: FAIL because the component does not yet exist.

- [ ] **Step 3: Write minimal implementation**

Create `ThemeSwitch` as a client component that reads the saved or system theme after hydration, writes `.dark` to the document root, persists manual changes, and renders the animated sun/moon switch.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/sidebar-theme-switch.test.mjs`

Expected: PASS.

### Task 2: Shared sidebar placement and NAVIGA dark surface

**Files:**
- Create: `src/components/theme-switch.tsx`
- Create: `src/components/theme-switch.module.css`
- Modify: `src/components/main-shell.tsx`
- Modify: `src/components/main-shell.module.css`
- Modify: `src/app/globals.css`
- Modify: `tests/sidebar-theme-switch.test.mjs`

**Interfaces:**
- Consumes: `ThemeSwitch` from Task 1.
- Produces: a compact switch block directly above `naviga-sidebar-profile`, themed shared shell surfaces, and regression coverage for placement.

- [ ] **Step 1: Extend the failing test**

```js
test('main shell places the theme control directly before the account card', async () => {
  const shell = await readFile('src/components/main-shell.tsx', 'utf8');
  assert.match(shell, /<ThemeSwitch\s*\/>\s*<DropdownMenu>/s);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/sidebar-theme-switch.test.mjs`

Expected: FAIL because `MainShell` has no theme control.

- [ ] **Step 3: Write minimal implementation**

Import `ThemeSwitch` into `MainShell` and render it before the account dropdown in the footer. Add token-driven light/dark styles for the sidebar, topbar, navigation controls, and profile card, including a reduced-motion fallback.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/sidebar-theme-switch.test.mjs`

Expected: PASS.

- [ ] **Step 5: Run verification**

Run: `npm test` and `npm run typecheck`.

Expected: all tests and TypeScript checks pass.

### Task 3: Shared content and overlay dark-theme treatment

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/(main)/profile/profile.module.css`
- Modify: `tests/sidebar-theme-switch.test.mjs`

**Interfaces:**
- Consumes: root `.dark` class applied by `ThemeSwitch`.
- Produces: a dark surface contract for every shared page region and portal-based popup.

- [ ] **Step 1: Write and run a failing regression test**

Add assertions for the shared dark surface token, `[role='dialog']`, reusable white-surface selector, and profile-specific `.dark` rule. Run `node --test tests/sidebar-theme-switch.test.mjs` and confirm the new assertion fails.

- [ ] **Step 2: Implement the shared and profile overrides**

Add dark surface, border, and readable-text rules to `globals.css` for standard content, dialogs, dropdowns, selects, and toasts. Override the profile page's existing local tokens and panels in its CSS module. Preserve semantic button colors and reduced-motion behavior.

- [ ] **Step 3: Verify**

Run `node --test tests/sidebar-theme-switch.test.mjs`, `npm test`, `npm run typecheck`, and `npm run build`.
