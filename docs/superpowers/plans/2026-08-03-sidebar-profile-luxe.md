# Sidebar Profile Luxe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline execution selected for this session). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the existing NAVIGA sidebar account trigger into a distinctive premium light-mode identity plaque while preserving its data, dropdown behavior, and compact one-line identity text.

**Architecture:** Keep the current `MainShell` markup and Radix dropdown ownership. Move the profile's visual contract into the existing CSS module through scoped profile tokens, a porcelain surface, a thin registration rail, an elevated avatar ring, and a chevron control field. No new component, route, API, database field, or dependency is needed.

**Tech Stack:** Next.js 15.3.3, React, Tailwind CSS 3.4.1, Plus Jakarta Sans, lucide-react, CSS Modules, Node test runner.

## Global Constraints

- Preserve the existing avatar, full name, email, chevron, dropdown actions, and account routes.
- Keep the interface light-mode with one restrained NAVIGA teal accent; do not add dark backing cards, gradients, neon, or outer glow.
- Keep each identity string on one visible line using `white-space: nowrap`, `overflow: visible`, and `text-overflow: clip`.
- Do not add role labels, account-status metadata, API calls, or dependencies.
- Do not run browser automation; use focused tests, the full static test suite, typecheck, and `git diff --check`.
- Run `graphify update .` after source changes.
- Deliver the work on `codex/sidebar-profile-luxe` as a reviewable PR; the user must merge it into `main` for GitHub to evaluate the second PR toward Pull Shark.

---

### Task 1: Lock the new profile contracts with focused tests

**Files:**
- Modify: `tests/profile-photo-policy.test.mjs:36-57`
- Modify: `tests/unit-management-visual.test.mjs:133-145`

**Interfaces:**
- Consumes: existing `shellSource` and `shellStyles` file-source assertions.
- Produces: explicit assertions for the porcelain profile surface, one-line identity text, and preserved interaction selectors.

- [x] **Step 1: Replace stale surface assertions**

Update the profile visual assertions so they expect the new light porcelain class/token and reject the old generic profile surface. Keep the existing avatar API, chevron, focus, disabled, open, and reduced-motion assertions.

Add assertions equivalent to:

```js
assert.match(shellSource, /naviga-sidebar-profile-plaque/);
assert.match(shellSource, /naviga-sidebar-profile-name block whitespace-nowrap overflow-visible/);
assert.match(shellSource, /naviga-sidebar-profile-email mt-0\.5 block whitespace-nowrap overflow-visible/);
assert.doesNotMatch(shellSource, /naviga-sidebar-profile-(?:name|email)[^\n]*truncate/);
assert.match(shellStyles, /--profile-paper/);
assert.match(shellStyles, /text-overflow: clip/);
```

- [x] **Step 2: Run the focused tests and confirm the contract fails before implementation**

Run: `node --test tests/profile-photo-policy.test.mjs tests/unit-management-visual.test.mjs`

Expected: FAIL because the new `naviga-sidebar-profile-plaque` class and scoped profile tokens do not exist yet.

---

### Task 2: Implement the Porcelain Identity Plaque

**Files:**
- Modify: `src/components/main-shell.tsx:226-236`
- Modify: `src/components/main-shell.module.css:94-290`

**Interfaces:**
- Consumes: `LocalSession.user` data, existing Avatar/DropdownMenu/Button components, and current sidebar CSS module.
- Produces: the same account trigger with a new visual token and unchanged dropdown behavior.

- [x] **Step 1: Refine the profile markup classes without adding DOM components**

Keep the existing structure and data bindings. Add `naviga-sidebar-profile-plaque` to the trigger, keep the compact `h-[76px]` geometry, use a non-wrapping flex row, and preserve the current name/email classes with visible overflow. Keep the avatar at `h-10 w-10` and the chevron field class.

The identity text must remain structurally equivalent to:

```tsx
<span className="min-w-0 flex-1 text-left">
  <span className="naviga-sidebar-profile-name block whitespace-nowrap overflow-visible text-clip ...">{user.name}</span>
  <span className="naviga-sidebar-profile-email mt-0.5 block whitespace-nowrap overflow-visible text-clip ...">{user.email}</span>
</span>
```

- [x] **Step 2: Replace the default profile visual contract with scoped tokens**

Within `.naviga-sidebar-profile`, define scoped custom properties for the porcelain paper, edge, ink, teal rail, hover surface, and tinted shadow. Use those variables for the default, open, hover, chevron, rail, and corner-field states so the component has one locked palette.

The default treatment must include:

```css
/* Hallmark · component: sidebar identity plaque · genre: modern-minimal · theme: NAVIGA porcelain teal
 * states: default · hover · focus · active · disabled · loading · error · success
 * contrast: pass (40-41) · responsive: pass (34, 49)
 */
.navigaSidebar :global(.naviga-sidebar-profile-plaque) {
  --profile-paper: #fbfdfb;
  --profile-paper-hover: #ffffff;
  --profile-edge: #b9ddd5;
  --profile-rail: #0b9b8c;
  --profile-ink: #123b47;
  --profile-muted: #5f7c85;
  --profile-shadow: rgba(16, 90, 94, 0.08);
  background: var(--profile-paper);
  border-color: var(--profile-edge);
}
```

Use a 2px restrained rail, an asymmetric top-right corner field, a double hairline avatar ring, and a short tinted inset shadow. Do not add a gradient or an outer glow.

- [x] **Step 3: Complete interaction and accessibility states**

Preserve the existing `:focus-visible`, `:active`, disabled, open, hover, and reduced-motion rules. Make hover alter only border, background, shadow, and chevron color; make active use only `transform`; keep the focus ring immediate and visible. Keep all spatial transitions on transform/opacity or short color transitions, and do not add perpetual motion.

- [x] **Step 4: Run focused tests and confirm they pass**

Run: `node --test tests/profile-photo-policy.test.mjs tests/unit-management-visual.test.mjs`

Expected: PASS for all tests in both files.

---

### Task 3: Refresh the project graph and run verification

**Files:**
- Modify: `graphify-out/.graphify_labels.json`
- Modify: `graphify-out/GRAPH_REPORT.md`
- Modify: `graphify-out/graph.html`
- Modify: `graphify-out/graph.json`
- Modify: `graphify-out/manifest.json`

**Interfaces:**
- Consumes: updated sidebar source and test relationships.
- Produces: refreshed AST graph artifacts with the new profile token relationships.

- [x] **Step 1: Update Graphify**

Run: `graphify update .`

Expected: Graphify rebuilds the graph without changing application source outside the requested files.

- [x] **Step 2: Run final static verification**

Run all of:

```text
npm run typecheck
npm test
git diff --check
```

Expected: typecheck passes, all tests pass, and `git diff --check` produces no output.

---

### Task 4: Commit, push, and open the reviewable PR

**Files:**
- Commit all intentional changes from Tasks 1-3.

**Interfaces:**
- Consumes: verified Porcelain Identity Plaque implementation and refreshed graph.
- Produces: a pushed branch and a second pull request targeting `main`.

- [ ] **Step 1: Inspect the final diff and working tree**

Run: `git status --short --branch` and `git diff --stat`.

Expected: only the specified profile, focused-test, Graphify, spec, and plan files are changed.

- [ ] **Step 2: Create the implementation commit**

Run:

```text
git add src/components/main-shell.tsx src/components/main-shell.module.css tests/profile-photo-policy.test.mjs tests/unit-management-visual.test.mjs graphify-out/GRAPH_REPORT.md graphify-out/graph.json graphify-out/manifest.json docs/superpowers/specs/2026-08-03-sidebar-profile-luxe-design.md docs/superpowers/plans/2026-08-03-sidebar-profile-luxe.md
git commit -m "feat: refine sidebar profile plaque"
```

- [ ] **Step 3: Push the feature branch**

Run: `git push -u origin codex/sidebar-profile-luxe`

- [ ] **Step 4: Open the pull request**

Create a PR from `codex/sidebar-profile-luxe` into `main` with a summary of the visual change and verification results. Do not merge it automatically; the user should review and merge it so GitHub records a legitimate second merged PR.
