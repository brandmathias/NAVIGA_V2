# NAVIGA Profile Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the active profile content to match the supplied NAVIGA reference while persisting profile photos up to 5 MB and leaving the shared header/sidebar untouched.

**Architecture:** Keep `MainShell` as the owner of the shared chrome. Make the profile route own its visual layout and interaction states, and put IndexedDB access in one small browser-storage utility so the component does not own database plumbing.

**Tech Stack:** Next.js 15 App Router, React 18, TypeScript, Tailwind CSS 3, CSS Modules, Lucide icons already installed, IndexedDB.

## Global Constraints

- Do not modify `src/components/main-shell.tsx`, `src/components/main-shell.module.css`, or `src/components/ui/sidebar.tsx`.
- Preserve the existing logout endpoint, toast behavior, session fields, and `/profile` route.
- Accept only `image/jpeg`, `image/png`, and `image/webp`; reject files over `5 * 1024 * 1024` bytes.
- Store the selected photo as an IndexedDB Blob and render it from an object URL.
- Use CSS transitions with explicit properties, focus-visible styles, active feedback, and reduced-motion fallback.
- Verify with `npm test`, `npm run typecheck`, and `npm run build`; browser automation is out of scope.

---

### Task 1: Add the photo storage boundary

**Files:**
- Create: `src/lib/profile-photo-storage.ts`
- Create: `tests/profile-photo-policy.test.mjs`

**Interfaces:**
- `MAX_PROFILE_PHOTO_SIZE = 5 * 1024 * 1024`
- `PROFILE_PHOTO_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']`
- `validateProfilePhoto(file: Pick<File, 'type' | 'size'>): string | null`
- `loadProfilePhoto(): Promise<Blob | null>`
- `saveProfilePhoto(file: Blob): Promise<void>`

- [ ] **Step 1: Write the policy test**

  Read the storage utility as text and assert the exported limit is 5 MB, the three accepted MIME types are present, and the rejection messages cover unsupported type and oversize input.

- [ ] **Step 2: Run the policy test**

  Run `node --test tests/profile-photo-policy.test.mjs` and confirm it fails because the utility does not exist yet.

- [ ] **Step 3: Implement the utility**

  Use one IndexedDB database and object store keyed by `avatar`. Wrap open/get/put requests in Promises, reject when IndexedDB is unavailable, and keep validation pure so the route can show inline errors.

- [ ] **Step 4: Run the policy test again**

  Run `node --test tests/profile-photo-policy.test.mjs` and confirm it passes.

### Task 2: Implement the profile layout and interactions

**Files:**
- Modify: `src/app/(main)/profile/page.tsx`
- Create: `src/app/(main)/profile/profile.module.css`

**Interfaces:**
- The page continues to consume `useLocalSession()` and `useToast()`.
- The page calls `loadProfilePhoto()` on mount and `saveProfilePhoto(file)` after validation.

- [ ] **Step 1: Replace the compact card markup**

  Keep the current logout handler and session-derived values, then render the reference structure: avatar/camera, account label, verified name, four metadata cards, security panel, and copyright.

- [ ] **Step 2: Add persisted photo lifecycle**

  Load the stored Blob into an object URL, revoke old URLs before replacement, revoke the active URL on unmount, clear the file input after each attempt, and surface validation/storage failures through `role="alert"` plus the existing toast hook.

- [ ] **Step 3: Add visual states**

  Add explicit hover/focus/active/disabled styles for the camera and logout controls, tooltip visibility for camera hover/focus, staggered entrance for profile regions, and reduced-motion overrides.

### Task 3: Verify the finished change

**Files:**
- Inspect: `src/app/(main)/profile/page.tsx`
- Inspect: `src/app/(main)/profile/profile.module.css`
- Inspect: `src/lib/profile-photo-storage.ts`

- [ ] **Step 1: Confirm scope**

  Run `git diff -- src/components/main-shell.tsx src/components/main-shell.module.css src/components/ui/sidebar.tsx` and confirm no shared chrome file changed.

- [ ] **Step 2: Run tests**

  Run `npm test` and confirm the full existing suite plus the photo policy test passes.

- [ ] **Step 3: Run typecheck**

  Run `npm run typecheck` and confirm exit code 0.

- [ ] **Step 4: Run one clean build**

  Run `npm run build` once, without parallel builds, and confirm exit code 0.

- [ ] **Step 5: Refresh the graph**

  Run `graphify update .` after the code changes.
