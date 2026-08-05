# Dashboard Single Viewport Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menjaga profil unit, Google Maps, serta kartu Penaksir dan Pengelola Unit terlihat bersamaan dalam satu viewport desktop tanpa membuat komponennya ceper atau penuh ruang kosong internal.

**Architecture:** Tambahkan hook kelas khusus pada dashboard lalu atur tinggi hanya pada desktop dengan media query berbasis lebar dan tinggi viewport. Tinggi profil dan peta dibuat lebih dominan serta adaptif, sedangkan ukuran, radius, dan komposisi kartu staf dipertahankan seperti sebelumnya; susunan mobile tetap mengalir vertikal agar tidak terpotong.

**Tech Stack:** Next.js 15, React, Tailwind CSS, CSS global, Node.js test runner.

## Global Constraints

- Tidak menambah atau menghapus informasi dashboard.
- Jam operasional dan sumber Google Maps tidak berubah.
- Desktop dengan tinggi minimal 720 px tidak memiliki scroll vertikal pada area dashboard.
- Layar kecil tetap boleh mengalir vertikal agar konten tidak terpotong.
- Interaksi hanya memakai `transform` dan `opacity`, serta menghormati `prefers-reduced-motion`.

---

### Task 1: Kontrak layout satu viewport

**Files:**
- Modify: `tests/dashboard-staff-cards.test.mjs`
- Modify: `src/app/(main)/dashboard/page.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: kelas dashboard dan staff registry yang sudah ada.
- Produces: hook `.dashboard-main`, `.dashboard-map-frame`, dan `.staff-registry-layout` untuk aturan viewport desktop.

- [ ] **Step 1: Write the failing test**

```js
assert.match(source, /className="dashboard-main/);
assert.equal(source.match(/staff-registry-card group rounded-full/g)?.length, 2);
assert.match(styles, /@media \(min-width: 1024px\) and \(min-height: 720px\)/);
assert.match(styles, /height:\s*calc\(100dvh - 5\.875rem\)/);
assert.match(styles, /overflow-y:\s*hidden/);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/dashboard-staff-cards.test.mjs`

Expected: FAIL karena kontrak satu viewport dan proporsi squircle belum ada.

- [ ] **Step 3: Write minimal implementation**

```tsx
<main className="dashboard-main ...">
<Card className="staff-registry-card group rounded-full ...">
<CardHeader className="staff-registry-layout ... p-4 pr-5">
```

```css
@media (min-width: 1024px) and (min-height: 720px) {
  .dashboard-main {
    height: calc(100dvh - 5.875rem);
    min-height: 0;
    overflow-y: hidden;
  }

  .dashboard-map-frame {
    height: clamp(22rem, 54dvh, 29rem);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/dashboard-staff-cards.test.mjs`

Expected: seluruh pengujian dashboard PASS.

- [ ] **Step 5: Verify the repository**

Run: `node --test`, `npm run typecheck`, `git diff --check`, lalu `graphify update .`.

Expected: seluruh pengujian dan typecheck lulus, diff bersih, dan graph berhasil diperbarui.
