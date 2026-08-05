# NAVIGA

NAVIGA adalah prototipe lokal untuk impor data jatuh tempo, pengelolaan tugas,
dan penyusunan notifikasi. Login memakai sesi lokal bertanda tangan; ekstraksi
PDF memakai pembacaan PDF lokal dan RapidDoc CPU bila OCR diperlukan; pesan
suara memakai Piper lokal. Tidak ada Firebase, Gemini, atau Google API di aplikasi ini.

Untuk menjalankan fitur lokal, gunakan skrip di `scripts/setup-piper.ps1`,
`scripts/start-piper.ps1`, dan `scripts/setup-local-pdf.ps1`.

## Uji lokal

1. Jalankan `npm ci`, lalu jalankan `npm run piper:setup` sekali untuk memasang
   Piper dan voice bahasa Indonesia.
2. Gunakan `npm run dev:local`. Perintah ini menyalakan Piper secara otomatis
   di `127.0.0.1:5000` lalu menjalankan Next.js. Jika Piper sudah aktif, proses
   tidak membuat instance kedua.
3. Jika hanya ingin menyalakan Piper, gunakan `npm run piper:start`.
4. Untuk impor PDF, jalankan
   `powershell -ExecutionPolicy Bypass -File scripts/setup-local-pdf.ps1` sekali.
   PDF digital dibaca langsung dengan pypdf yang ringan. PDF hasil scan otomatis
   memakai RapidDoc CPU dan model ONNX lokal. Java tidak diperlukan.
5. Saat pertama dijalankan, login memakai akun Superadmin atau akun unit yang
   telah didaftarkan secara lokal. Superadmin dapat membuka **Manajemen Unit**
   untuk menambahkan unit, email akun unit, dan lima digit awal SBG/nomor
   angsuran. Data akun tersimpan sebagai hash di `.naviga/unit-registry.json`;
   berkas `.env.local` dan `.naviga/` tidak ikut dibagikan melalui Git.

## Cakupan unit

- Akun unit hanya dapat mengimpor data dengan lima digit pertama SBG/nomor
  angsuran yang terdaftar pada unitnya.
- Superadmin dapat mengimpor semua unit aktif dan mendaftarkan unit baru.
- UPC Garuda belum didaftarkan karena kode lima digitnya belum tersedia.

Excel angsuran tidak memuat nomor WhatsApp. Karena itu fiturnya hanya salin
template dan pembuatan/pratinjau/unduh WAV Piper lokal. Aksi WhatsApp hanya
tersedia pada hasil PDF gadai dengan nomor seluler Indonesia yang valid.
