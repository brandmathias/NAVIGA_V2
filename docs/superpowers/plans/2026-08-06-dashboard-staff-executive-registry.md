# Dashboard Staff Executive Registry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengubah dua kartu staf dashboard menjadi Executive Registry yang premium tanpa menambah atau mengubah informasi.

**Architecture:** Pertahankan struktur data dan primitive Card/Avatar yang ada. Tambahkan kelas semantik pada markup dashboard dan satu blok CSS terisolasi di stylesheet global agar lapisan visual dapat dibuat lewat pseudo-element tanpa komponen baru.

**Tech Stack:** Next.js 15 App Router, React 18, Tailwind CSS 3, CSS custom properties, Node test runner.

## Global Constraints

- Informasi tetap hanya jabatan, nama, NIP, dan avatar/inisial yang sudah ada.
- Tidak menambah dependency atau komponen React baru.
- Gunakan token NAVIGA dan maksimal satu aksen teal.
- Hover bergerak maksimal satu piksel dan hanya aktif pada pointer presisi.
- Dukung `prefers-reduced-motion` dan viewport 320, 375, 414, serta 768 piksel.
- Jangan stage perubahan README, Piper, package, atau Graphify yang tidak terkait.

---

### Task 1: Executive Registry Staff Cards

**Files:**
- Create: `tests/dashboard-staff-cards.test.mjs`
- Modify: `src/app/(main)/dashboard/page.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `profileData.staff.penaksir` dan `profileData.staff.pengelola` dari dashboard yang ada.
- Produces: kelas `staff-registry-card`, varian `data-registry-role`, serta subkelas avatar dan tipografi yang hanya mengatur tampilan.

- [ ] **Step 1: Write the failing test**

Tambahkan pengujian yang membaca dashboard dan stylesheet, lalu memastikan kedua varian kartu, kelas Executive Registry, lapisan pseudo-element, hover pointer-presisi, dan reduced-motion tersedia tanpa copy baru.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/dashboard-staff-cards.test.mjs`

Expected: FAIL karena kelas `staff-registry-card` belum ada.

- [ ] **Step 3: Write minimal implementation**

Tambahkan kelas semantik ke dua Card/CardHeader/Avatar/blok teks yang sudah ada. Tambahkan token lokal dan CSS pseudo-element di `globals.css`; jangan membuat komponen baru atau mengubah ekspresi data staf.

- [ ] **Step 4: Run focused and full verification**

Run: `node --test tests/dashboard-staff-cards.test.mjs`

Expected: PASS.

Run: `npm test`

Expected: seluruh test PASS.

Run: `npm run typecheck`

Expected: exit code 0.

- [ ] **Step 5: Refresh graph and inspect the final diff**

Run: `graphify update .`

Kemudian periksa status, diff terkait, dan `git diff --check` sebelum staging.

- [ ] **Step 6: Commit and push**

Stage hanya dokumen desain/rencana, dashboard, Google Maps helper/test, CSS, dan pengujian kartu staf. Commit dengan pesan `feat: refine unit dashboard profile`, lalu push branch `codex/sidebar-profile-luxe` tanpa force push.
