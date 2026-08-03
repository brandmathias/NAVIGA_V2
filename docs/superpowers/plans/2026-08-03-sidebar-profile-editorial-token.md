# Sidebar Profile Editorial Identity Token Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengubah plaque profil sidebar light mode menjadi artefak identitas editorial yang khas tanpa menambah data, komponen, atau perilaku baru.

**Architecture:** Pertahankan `DropdownMenuTrigger`, `Avatar`, nama, email, dan `ChevronDown` yang sudah ada. Siluet, rail tipis, corner field chevron, serta state interaksi dikerjakan melalui kelas Tailwind pada trigger dan CSS Module yang sudah menaungi sidebar.

**Tech Stack:** Next.js 15, React, Tailwind CSS 3.4, CSS Modules, Node test runner, TypeScript, Graphify.

## Global Constraints

- Default light mode menggunakan surface terang; plaque gelap hanya boleh muncul melalui override `.dark`.
- Tidak menambah label role, status, metadata, atau elemen DOM baru pada profil.
- Tidak mengubah perilaku dropdown, autentikasi, route, halaman profil penuh, atau perubahan broadcast/database lain.
- Semua state visual tetap memiliki focus-visible, active, disabled, open, hover, dan reduced-motion treatment.
- Verifikasi tidak menggunakan browser automation.

---

### Task 1: Kunci kontrak struktur editorial pada tes

**Files:**
- Modify: `tests/profile-photo-policy.test.mjs:34-48`

**Interfaces:**
- Consumes: source `src/components/main-shell.tsx` dan `src/components/main-shell.module.css`.
- Produces: assertion yang memastikan light plaque, corner field, rail, avatar overlap, dan state CSS tetap hadir tanpa role label baru.

- [x] **Step 1: Tambahkan assertion struktur yang akan dipenuhi implementasi**

Tambahkan assertion source-level berikut di subtest profil sidebar:

```js
assert.match(shellSource, /relative z-\[1\] -ml-1/);
assert.match(shellSource, /naviga-sidebar-profile-chevron/);
assert.match(shellSource, /bg-\[#fbfdfc\]/);
assert.match(shellStyles, /naviga-sidebar-profile-corner/);
assert.match(shellStyles, /naviga-sidebar-profile-rail/);
assert.match(shellStyles, /prefers-reduced-motion/);
```

- [x] **Step 2: Jalankan tes profil dan pastikan assertion baru gagal**

Run: `rtk node --test tests/profile-photo-policy.test.mjs`

Expected: gagal karena kelas editorial baru belum ada; failure ini menjadi kontrak implementasi, bukan alasan untuk mengubah assertion menjadi lebih longgar.

### Task 2: Implementasikan silhouette editorial pada trigger profil

**Files:**
- Modify: `src/components/main-shell.tsx:222-236`
- Modify: `src/components/main-shell.module.css:87-146`

**Interfaces:**
- Consumes: trigger dropdown dan child components yang sudah ada.
- Produces: light plaque editorial dengan avatar overlap, rail, corner field chevron, dan state interaksi yang tetap kompatibel dengan dropdown.

- [x] **Step 1: Terapkan kelas light-mode pada trigger dan avatar**

Gunakan surface `#fbfdfc`, border mineral terang, radius asimetris, shadow pendek bernuansa teal, serta avatar `relative z-[1] -ml-1`. Pertahankan `aria-label`, ukuran sidebar, dan seluruh child data yang sudah ada.

- [x] **Step 2: Tambahkan class hooks pada pseudo-element melalui CSS Module**

Pertahankan pseudo-element, lalu tambahkan marker class pada komentar/selector CSS dengan bentuk berikut:

```css
.navigaSidebar :global(.naviga-sidebar-profile-rail) {
  /* 1px registration rail; pointer-events: none */
}

.navigaSidebar :global(.naviga-sidebar-profile-corner) {
  /* chevron corner field; no layout-changing animation */
}
```

Kelas tersebut dipakai sebagai selector CSS bersama pseudo-element yang sudah dimiliki trigger; tidak boleh membuat elemen visual tambahan di JSX.

- [x] **Step 3: Lengkapi state visual**

Pastikan CSS memberi treatment terpisah untuk default, hover, focus-visible, active, disabled, open, dark override, dan `prefers-reduced-motion`. Hover hanya menguatkan border/surface/corner field; active memakai transform ringan; tidak memakai `transition-all`, glow, atau gradient baru.

- [x] **Step 4: Jalankan tes profil setelah implementasi**

Run: `rtk node --test tests/profile-photo-policy.test.mjs`

Expected: PASS untuk seluruh subtest profil.

### Task 3: Verifikasi integrasi dan sinkronisasi Graphify

**Files:**
- Verify: `src/components/main-shell.tsx`
- Verify: `src/components/main-shell.module.css`
- Verify: `tests/profile-photo-policy.test.mjs`
- Update: `graphify-out/` melalui Graphify

**Interfaces:**
- Consumes: implementasi editorial dari Task 2.
- Produces: bukti test, typecheck, diff check, dan graph yang konsisten.

- [x] **Step 1: Jalankan typecheck**

Run: `rtk npm run typecheck`

Expected: exit code 0.

- [x] **Step 2: Jalankan seluruh test normal**

Run: `rtk npm test`

Expected: seluruh test lulus tanpa browser automation.

- [x] **Step 3: Periksa whitespace dan konflik perubahan**

Run: `rtk git diff --check`

Expected: tidak ada output error; perubahan broadcast/database yang sudah ada tetap tidak tersentuh secara fungsional.

- [x] **Step 4: Perbarui Graphify**

Run: `rtk graphify update .`

Expected: Graphify selesai dan graph mencerminkan source terbaru.
