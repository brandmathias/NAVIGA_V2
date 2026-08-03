# Sidebar Profile — Editorial Identity Token

## Tujuan

Membuat profil akun di sidebar terasa khas dan berkarakter pada light mode, bukan sekadar kartu putih dengan radius dan shadow. Komponen tetap ringkas karena sidebar hanya perlu menampilkan foto, nama, email, dan chevron menu.

## Batasan

- Tidak menambah label seperti "Akun aktif", role badge, status, atau metadata baru.
- Tidak mengubah perilaku `DropdownMenu`, autentikasi, route, atau data sesi.
- Tidak mengubah halaman profil penuh, header, navigasi, atau perubahan broadcast/database yang sedang berjalan.
- Default light mode tidak boleh memakai surface gelap atau aksen gelap sebagai bidang utama.
- Mode gelap tetap memiliki override tersendiri dan tidak dipaksa mengikuti treatment light mode.

## Arah visual: editorial identity token

Profil diperlakukan seperti token identitas editorial—sebuah objek kecil yang memiliki siluet dan ritme sendiri, bukan card dashboard generik.

- **Siluet:** radius asimetris dengan sudut kanan atas yang lebih panjang dan bidang sudut chevron yang terasa seperti potongan editorial.
- **Material:** surface putih-hijau sangat terang, border mineral tipis, dan shadow pendek bernuansa teal dengan inner hairline; tanpa gradient, glow, atau blok warna gelap.
- **Rail:** satu garis aksen vertikal tipis menjadi tanda registrasi visual, bukan strip dekoratif tebal.
- **Avatar:** ring putih dengan outline teal lembut dan overlap kecil terhadap rail agar identitas terasa berlapis tanpa menambah elemen baru.
- **Chevron:** tetap ikon yang sama, tetapi ditempatkan di bidang sudut kecil dengan border internal sehingga kontrol menu terbaca sebagai bagian dari artefak, bukan ikon mengambang.
- **Tipografi:** nama menjadi anchor utama dengan teal-navy yang terbaca; email tetap sekunder dan tidak mengambil perhatian.

## Interaksi

- **Default:** surface terang dan tenang; seluruh konten tetap memiliki kontras yang jelas.
- **Hover:** border dan bidang chevron sedikit menguat, tanpa mengubah ukuran layout atau menambah shadow besar.
- **Focus-visible:** outline teal 2px dengan offset yang konsisten.
- **Active:** tactile press singkat menggunakan transform ringan.
- **Open:** chevron berputar 180 derajat dan surface naik satu tingkat secara halus.
- **Disabled:** opacity turun, cursor berubah, dan transform dinonaktifkan.
- **Reduced motion:** menonaktifkan transform sehingga hanya warna/border yang berubah.

## Implementasi dan verifikasi

Perubahan produksi dibatasi pada:

- `src/components/main-shell.tsx` — kelas visual pada trigger, avatar, teks, dan chevron yang sudah ada.
- `src/components/main-shell.module.css` — siluet editorial, rail, corner field, serta semua state interaksi.
- `tests/profile-photo-policy.test.mjs` — kontrak bahwa data profil tetap sama dan default light mode tidak kembali ke plaque gelap.

Verifikasi memakai test Node normal, typecheck, `git diff --check`, dan pembaruan Graphify. Browser automation tidak diperlukan.

## Kriteria selesai

1. Screenshot light mode terbaca sebagai objek identitas editorial yang berbeda dari kartu profil generik.
2. Tidak ada komponen, label, atau data baru yang tampil.
3. Dropdown tetap terbuka melalui trigger yang sama.
4. Hover, focus, active, open, disabled, dan reduced-motion memiliki treatment yang eksplisit.
5. Nama, email, dan foto tetap aman pada lebar sidebar tanpa horizontal overflow.
