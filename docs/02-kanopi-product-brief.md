# Kanopi — Product Brief

> Sistem manajemen sewa untuk pemilik Airbnb dengan **lebih dari 10 rumah**.
> Versi ini: web, frontend-only, data contoh di browser.

---

## 1. Siapa penggunanya

**Owner-operator dengan 10–40 unit.** Bukan pengelola satu villa (belum sakit), bukan chain hotel (punya PMS sendiri). Ciri khasnya:

- Listing tersebar di beberapa kanal; Airbnb dominan, sisanya Booking.com dan direct.
- Punya 3–8 orang di lapangan: cleaning, laundry, teknisi, satu supervisor.
- Tahu omzetnya, **tidak tahu laba per unit**. Biaya tercecer di WhatsApp, nota, dan tiga file Excel.
- Tidak berada di lokasi. Kendali atas apa yang benar-benar terjadi di dalam rumah = nol.

Pada 10 unit ke atas, dua hal patah bersamaan: **uangnya tidak lagi bisa dilacak di kepala**, dan **kualitas tidak lagi bisa diawasi dengan datang sendiri**. Kanopi menyerang tepat dua titik itu.

## 2. Masalah yang dikerjakan

| # | Masalah | Wujudnya di produk |
|---|---|---|
| 1 | Harga ditetapkan sekali lalu dilupakan; akhir pekan dan musim ramai tidak dimanfaatkan | Harga dasar + kenaikan akhir pekan + aturan musim, terlihat sebagai kalender harga per malam |
| 2 | Owner tahu omzet, tidak tahu **laba** | Laba rugi per unit: pendapatan setelah komisi − biaya, margin, ADR, RevPAR |
| 3 | Biaya bocor tanpa jejak | Pencatatan biaya rutin vs insidental, rasio biaya, biaya per malam terjual, peringkat kategori dan unit |
| 4 | Satu booking bisa merugi tanpa disadari (diskon + komisi + biaya kebersihan) | Simulator: dari harga tamu sampai laba bersih per booking, lengkap dengan komisi kanal dan biaya variabel |
| 5 | Pekerjaan lapangan tidak terverifikasi | Papan pekerjaan dengan checklist; langkah tertentu ditandai wajib bukti kamera |
| 6 | Tidak ada mata di dalam rumah | Body cam portabel yang dibawa petugas: sesi terekam per pekerjaan, kronologi, penandaan anomali |

## 3. Kenapa body cam portabel, bukan CCTV terpasang

CCTV permanen di dalam rumah sewa **bermasalah secara hukum dan kepercayaan tamu** — Airbnb melarang kamera di ruang interior. Maka kameranya tidak boleh tinggal di rumah; kamera **datang bersama petugas dan pergi bersama petugas**.

Konsekuensi desain yang diambil:

- Kamera adalah milik operasi, bukan milik properti. Registrinya berisi perangkat → petugas, bukan perangkat → ruangan.
- Rekaman terikat ke **sesi kerja**, bukan ke rentang waktu 24 jam. Satu sesi = satu pekerjaan.
- Nilainya bukan pengawasan terus-menerus, melainkan **bukti**: kondisi awal, langkah kritis, kondisi akhir, dan kunci pintu — persis yang dibutuhkan saat tamu mengklaim barang hilang atau rumah kotor.
- Anomali (kamera tertutup, perangkat keluar radius properti, sesi berhenti mendadak) ditandai untuk ditinjau **sebelum upah disetujui**.

## 4. Ruang lingkup versi ini

**Termasuk:** delapan modul di README — ringkasan, properti, harga & musim, biaya, layanan, monitoring, laporan, pengaturan. Semua interaktif: ubah harga, tambah aturan musim, catat biaya, ubah status pekerjaan, centang checklist, pasangkan perangkat, mulai/hentikan sesi, ekspor CSV.

**Sengaja tidak termasuk:** server, autentikasi, integrasi kanal, streaming kamera sungguhan, rekonsiliasi payout, akuntansi penuh, aplikasi petugas. Semua tercantum terbuka di halaman Pengaturan agar tidak ada yang salah kira saat demo.

## 5. Prinsip desain yang dipegang

1. **Angka yang diputuskan, bukan angka yang ada.** Setiap layar menjawab satu pertanyaan owner: unit mana yang rugi, biaya apa yang membengkak, pekerjaan mana yang terlewat.
2. **Kerugian ditampilkan, tidak disembunyikan.** Laba negatif berwarna kritis, margin tipis diberi lencana, okupansi di bawah target muncul sebagai peringatan.
3. **Status tidak pernah hanya warna.** Setiap lencana punya ikon dan teks — syarat keterbacaan bagi pengguna buta warna dan saat dicetak.
4. **Satu sumbu per chart.** Dua satuan berbeda (Rupiah dan persen) tidak pernah ditumpuk di satu grafik.
5. **Kepadatan tinggi, tanpa berisik.** Tabel rapat dengan angka rata kanan tabular; grid dan sumbu dibuat resesif agar data yang menonjol.

## 6. Urutan pembangunan berikutnya

```
Fase 1 (sudah, versi ini) : konsol read-write lokal — harga, biaya, layanan, monitoring
Fase 2                    : backend + autentikasi + peran (owner, supervisor, petugas)
                            aplikasi petugas di HP: checklist, foto, mulai/stop sesi kamera
Fase 3                    : integrasi kanal (Airbnb/Booking lewat channel manager),
                            rekonsiliasi payout vs booking vs komisi
Fase 4                    : gateway kamera nyata (WebRTC/RTSP), penyimpanan klip berbatas waktu,
                            kebijakan retensi dan akses
Fase 5                    : laporan pemilik (bila unit milik pihak ketiga), pajak daerah, akuntansi
```

Yang dikerjakan lebih dulu bukan yang paling canggih, melainkan yang paling cepat menghentikan kebocoran uang: **harga dan biaya dulu, kamera menyusul sebagai penjaga kualitas.**

## 7. Ukuran keberhasilan

- Owner bisa menjawab "unit mana yang rugi bulan lalu" dalam < 30 detik tanpa membuka Excel.
- Setiap pekerjaan cleaning punya bukti visual awal dan akhir.
- Selisih antara biaya tercatat dan biaya sebenarnya menyusut di bawah 10% dalam dua bulan pemakaian.
