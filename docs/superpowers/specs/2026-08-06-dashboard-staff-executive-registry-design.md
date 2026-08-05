# Dashboard Staff Executive Registry Design

## Tujuan

Memoles kartu Penaksir dan Pengelola Unit pada dashboard menjadi lebih premium, elegan, dan khas tanpa mengubah informasi, urutan, sumber data, atau struktur halaman lainnya.

## Arah Visual

Gunakan bahasa visual **Executive Registry**: panel berlapis yang tenang, garis aksen teal presisi, avatar seperti medali identitas, tipografi bertingkat jelas, dan bayangan berwarna lembut. Kedua kartu tetap menjadi pasangan yang konsisten; pembeda visual hanya berupa variasi posisi aksen yang sangat halus.

## Batasan

- Tetap menampilkan hanya jabatan, nama, NIP, dan avatar/inisial yang sudah ada.
- Tidak menambah badge, ikon, tombol, status, label, atau informasi baru.
- Tidak mengubah data staf, Google Maps, jam operasional, sidebar, maupun kartu profil UPC.
- Menggunakan token warna dan font NAVIGA yang sudah tersedia.
- Tidak menambah dependency atau komponen React baru.
- Tetap nyaman pada lebar 320, 375, 414, dan 768 piksel tanpa overflow horizontal.

## Detail Komponen

- Card memakai kelas khusus `staff-registry-card` dan atribut varian untuk Penaksir/Pengelola Unit.
- Lapisan visual dibangun lewat pseudo-element CSS sehingga DOM dan informasi tetap minimal.
- Avatar diperbesar sedikit dan diberi ring konsentris menyerupai medali identitas.
- Jabatan menjadi lapisan pertama yang mudah dipindai, nama menjadi fokus utama, dan NIP tetap tenang tetapi terbaca.
- Hover hanya aktif pada perangkat dengan pointer presisi: kartu bergerak maksimal satu piksel dengan perubahan border dan bayangan lembut.
- `prefers-reduced-motion` mematikan perpindahan spasial.

## Pengujian

Satu pengujian regresi memastikan kedua kartu memakai kontrak Executive Registry, informasi staf tetap sama, dan tidak muncul elemen informasi baru. Setelah implementasi, jalankan pengujian fokus, seluruh test suite, typecheck, Graphify update, serta pemeriksaan diff sebelum commit dan push.
