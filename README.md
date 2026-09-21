# Kanopi — Rental Ops untuk Pemilik 10+ Unit Airbnb

Konsol operasi sewa harian: **harga, biaya, layanan lapangan, monitoring, dan body cam portabel** yang dibawa petugas kebersihan — dalam satu layar.

> **Frontend-only.** Tidak ada backend. Seluruh data adalah data contoh yang dibangkitkan secara deterministik di browser dan disimpan di `localStorage`. Tidak ada panggilan jaringan, tidak ada autentikasi, tidak ada integrasi OTA.

## Menjalankan

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # keluaran statis di dist/
npm run preview  # menyajikan hasil build
```

Butuh Node 18+. Tanpa variabel lingkungan, tanpa layanan eksternal.

## Modul

| Rute | Isi |
|---|---|
| `/dashboard` | KPI portofolio, pendapatan vs biaya, okupansi, daftar "perlu perhatian", jadwal hari ini, performa per unit |
| `/properties` | Daftar unit + panel detail: performa, konfigurasi harga & biaya, kanal aktif, riwayat booking dan layanan |
| `/pricing` | Harga dasar, kenaikan akhir pekan, aturan musim (CRUD), kalender harga per malam, simulator harga→laba |
| `/expenses` | Biaya rutin & insidental, rasio biaya, biaya per malam terjual, rincian per kategori dan per unit, input biaya baru |
| `/services` | Papan pekerjaan cleaning/laundry/perbaikan/inspeksi, checklist dengan langkah wajib bukti kamera |
| `/monitoring` | Dinding pantau body cam, registri perangkat, penugasan ke petugas, mulai/hentikan sesi, riwayat & kronologi sesi |
| `/reports` | Laba rugi per unit, kanal penjualan, ADR, okupansi vs target, ekspor CSV |
| `/settings` | Tema, tim lapangan, perangkat terdaftar, reset data, batasan versi ini |

## Arsitektur

```
src/
  types.ts              model domain (properti, booking, biaya, job, device, sesi kamera)
  lib/
    rng.ts              PRNG deterministik — data contoh selalu sama
    seed.ts             generator data contoh + rumus harga per malam
    metrics.ts          okupansi, ADR, RevPAR, laba rugi per unit
    format.ts           Rupiah, tanggal, waktu relatif
    csv.ts              ekspor CSV sisi klien
  store/useStore.tsx    state global + persistensi localStorage
  components/           primitif UI, ikon, dan chart kit SVG (tanpa library chart)
  pages/                delapan halaman modul
  styles.css            design token + layout
```

**Keputusan teknis**

- Tidak memakai library chart. Chart dibuat sebagai SVG agar mark, jarak antar-bar, dan tooltip mengikuti aturan visual yang sama di mode terang dan gelap.
- Palet seri data dipilih dari slot kategorikal yang tervalidasi keterbacaannya untuk buta warna; status (baik/peringatan/kritis) selalu disertai ikon dan label, tidak pernah warna saja.
- `localStorage` dibungkus `try/catch` — aplikasi tetap jalan saat penyimpanan diblokir (mode privat).
- Tema mengikuti preferensi sistem, dapat ditimpa lewat tombol di topbar.

## Yang belum ada

Lihat halaman **Pengaturan → Batasan versi ini**. Ringkasnya: belum ada server, integrasi Airbnb/Booking.com, streaming kamera sungguhan, autentikasi, dan rekonsiliasi payout.

Latar produk dan urutan pembangunan ada di [`docs/02-kanopi-product-brief.md`](docs/02-kanopi-product-brief.md).
