# Profil NAVIGA — Rancangan Redesign

## Tujuan

Menyesuaikan konten halaman profil aktif dengan referensi visual yang diberikan, tanpa mengubah header, sidebar, route, atau alur logout yang sudah dimiliki aplikasi.

## Batasan

- Modifikasi produksi hanya pada halaman profil dan utilitas penyimpanan foto.
- Header dan sidebar tetap dirender oleh `MainShell` tanpa perubahan.
- Foto profil harus bertahan setelah refresh dan ukuran file maksimal 5 MB.
- Format yang diterima: JPEG, PNG, dan WEBP.
- Verifikasi menggunakan typecheck, test suite, dan build; tidak memakai browser automation.

## Struktur visual

- Konten profil menjadi panel putih ber-radius besar dengan latar mint transparan dan ornamen radial lembut.
- Bagian utama memakai layout dua area: avatar besar di kiri, identitas serta kartu metadata di kanan.
- Metadata memakai empat kartu 2×2: Nama Lengkap, Alamat Email, Unit/Cabang, dan Peran Akses.
- Panel bawah berisi status Akses Aman dan tombol Keluar coral.
- Di bawah panel tampil copyright yang sudah sesuai dengan referensi.
- Pada layar kecil, layout turun menjadi satu kolom dan tombol Keluar memenuhi lebar panel.

## Motion dan aksesibilitas

- Kepribadian motion: corporate, ringan, cepat, dan tenang.
- Hover kamera: scale 1.08, rotasi 3 derajat, perubahan gradient, pergeseran ikon, dan tooltip.
- Hover Keluar: naik 2 px, highlight melintas, ikon bergeser ke kanan, dan shadow menguat.
- Semua kontrol memiliki focus-visible ring, active press feedback, serta fallback `prefers-reduced-motion`.
- Animasi hanya memakai transform, opacity, warna, dan shadow; tidak mengubah layout saat hover.

## Persistensi foto

File foto disimpan sebagai `Blob` di IndexedDB, bukan base64 di `localStorage`, supaya batas file 5 MB tidak rapuh akibat pembesaran base64 dan keterbatasan kuota localStorage. Preview memakai object URL dan URL tersebut direvoke saat diganti atau komponen unmount.

## File yang disentuh

- Ubah `src/app/(main)/profile/page.tsx`.
- Buat `src/app/(main)/profile/profile.module.css`.
- Buat `src/lib/profile-photo-storage.ts`.
- Buat `tests/profile-photo-policy.test.mjs` untuk memeriksa kebijakan ukuran/format secara biasa.

Tidak ada file yang dihapus atau diubah pada header/sidebar.
