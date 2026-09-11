# Analisa: Vertikal ERP yang Worth Dibangun di Era AI

> Status: dokumen strategi awal (belum ada keputusan final).
> Semua angka pasar di bawah adalah **estimasi kasar untuk diurutkan prioritas**, bukan data terverifikasi. Sebelum commit modal/waktu, validasi via BPS, data asosiasi (GAPKI, GPFI, Kadin, IPMG/GP Farmasi, APBI), dan wawancara 15–20 calon user.

---

## 1. Premis: apa yang sebenarnya di-komoditisasi oleh AI

AI membuat **penulisan kode** menjadi murah. AI **tidak** membuat hal-hal berikut menjadi murah:

| Yang jadi murah (jangan jadikan moat) | Yang tetap mahal (ini moat-nya) |
|---|---|
| CRUD, form, tabel, report builder | Akses ke user & kepercayaan industri |
| Auth, multi-tenant, RBAC | Pengetahuan proses fisik yang tidak terdokumentasi |
| Akuntansi dasar, invoice, POS | Integrasi wajib regulator (yang berubah tiap tahun) |
| Dashboard, chart | Integrasi hardware di lapangan |
| Import/export Excel | Data historis milik pelanggan (switching cost) |
| Workflow engine generik | Tanggung jawab legal saat sistem salah hitung |

**Kesimpulan operasional:** vertikal yang "aman" dari AI bukan yang *kodenya sulit*, tapi yang **konteks non-kodenya sulit didapat**. Ada 5 jenis moat yang bertahan:

1. **Regulatory lock-in** — sistem harus tersambung ke API pemerintah yang aksesnya perlu badan usaha, izin, sertifikasi, dan kadang NDA. (Coretax DJP, CEISA Bea Cukai, SIMBARA ESDM, BPOM e-was, SatuSehat, SLIK OJK)
2. **Hardware-in-the-loop** — jembatan timbang, timbangan digital, PLC/SCADA, RFID, GPS tracker, printer thermal/label, barcode 2D, sensor suhu. AI tidak bisa menebak protokol serial merk lokal.
3. **Proses fisik tacit** — rumus rendemen, susut, sortasi, grading, potongan kualitas, konversi satuan ganda, biaya overhead per proses. Ini ada di kepala mandor/kepala pabrik, bukan di internet.
4. **Offline-first di lokasi tanpa sinyal** — kebun, tambang, kapal, gudang beku, proyek konstruksi remote. Ini rekayasa sinkronisasi data yang berat dan gampang salah.
5. **Konsekuensi salah hitung yang mahal** — kalau salah, pelanggan kena denda pajak/audit/ekspor ditolak. Ini yang membuat mereka mau bayar mahal dan tidak gampang pindah.

**Vertikal terbaik = punya ≥3 dari 5 moat di atas.**

---

## 2. Yang JANGAN dibangun (sudah merah / gampang di-clone AI)

- ERP retail / F&B / POS umum — puluhan pemain, harga sudah jatuh ke ratusan ribu/bulan.
- Accounting SaaS UMKM — sudah dikuasai incumbent, marjin tipis.
- HRIS / payroll generik — sangat ramai, diferensiasi nol.
- "ERP all-in-one untuk semua industri" — ini justru zona paling mudah dibuat AI dan paling sulit dijual.
- Klinik/RS kecil — moat regulasi kuat (SatuSehat, BPJS), tapi sudah banyak pemain dan siklus jual lambat + politis.

---

## 3. Kandidat yang dievaluasi

Skor 1–5 per dimensi. `Moat AI` = seberapa sulit di-clone. `Luas` = jumlah calon pelanggan. `Sepi` = seberapa belum tersentuh. `ARPU` = kemampuan bayar. `Cepat` = kecepatan sampai pelanggan bayar pertama.

| # | Vertikal | Moat AI | Luas | Sepi | ARPU | Cepat | Total |
|---|---|---|---|---|---|---|---|
| 1 | **Sawit: kebun + PKS + traceability** | 5 | 5 | 4 | 5 | 3 | **22** |
| 2 | **Distribusi farmasi/alkes (PBF, CDOB)** | 5 | 4 | 4 | 4 | 4 | **21** |
| 3 | **Tambang & quarry (SIMBARA, batu-split, nikel)** | 5 | 3 | 5 | 5 | 3 | **21** |
| 4 | Kontraktor / konstruksi menengah | 3 | 5 | 4 | 3 | 4 | 19 |
| 5 | Perikanan & cold chain (ketertelusuran ekspor) | 4 | 3 | 5 | 3 | 3 | 18 |
| 6 | Peternakan unggas terintegrasi (closed house, FCR) | 4 | 3 | 4 | 3 | 3 | 17 |
| 7 | Logistik / freight forwarding & PPJK (CEISA, NLE) | 4 | 4 | 3 | 3 | 3 | 17 |
| 8 | Garment/tekstil CMT & makloon | 3 | 4 | 3 | 3 | 3 | 16 |
| 9 | Koperasi / BMT / multifinance (SLIK, OJK) | 4 | 4 | 2 | 2 | 3 | 15 |

---

## 4. Rekomendasi utama: ERP Rantai Pasok Sawit (kebun → PKS → traceability)

### Kenapa ini

**a. Pasarnya besar dan mampu bayar.**
Indonesia adalah produsen CPO terbesar dunia. Populasi calon pelanggan berlapis: pabrik kelapa sawit (PKS) skala menengah, perusahaan perkebunan, koperasi plasma, agen/ramp/peron pengumpul TBS, dan transporter. Segmen menengah inilah yang uangnya ada tapi software-nya masih Excel + aplikasi timbangan warisan yang tidak terhubung ke apa pun.

**b. Incumbent-nya lemah atau terlalu mahal.**
Yang besar memakai SAP/Oracle dengan biaya implementasi miliaran. Yang menengah memakai kombinasi: aplikasi jembatan timbang buatan vendor lokal (standalone, tanpa akuntansi), Excel untuk panen dan upah panen, software akuntansi terpisah. Tidak ada yang menyatukan. Celah ini lebar sekali.

**c. Ada pemaksa regulasi yang sedang aktif.**
Regulasi ketertelusuran deforestasi Uni Eropa (EUDR) menuntut bukti asal komoditas sampai **koordinat poligon kebun**, plus sertifikasi ISPO (wajib) dan RSPO (pasar ekspor). Artinya: setiap tandan harus bisa ditelusuri balik ke blok kebun, tanggal panen, dan pemilik lahan. Ini **tidak bisa dikerjakan dengan Excel**, dan pabrik yang tidak punya sistemnya akan kehilangan pembeli ekspor. Ini pemaksa pembelian yang nyata, bukan "nice to have".

**d. Moat-nya lengkap (5 dari 5).**
- *Hardware*: integrasi jembatan timbang (indikator Avery/Toledo/Cardinal via serial/TCP), CCTV/ANPR di pos timbang, printer tiket, GPS truk, RFID/QR per truk & per gancu, aplikasi mandor offline.
- *Proses tacit*: perhitungan rendemen CPO & PK, sortasi TBS (buah mentah, busuk, tangkai panjang) yang jadi dasar potongan harga, BJR (berat janjang rata-rata), premi & denda panen, upah borongan per jenjang, restan, susut angkut, losses di pabrik. Rumus ini **berbeda tiap pabrik** dan tidak ada di dokumentasi publik.
- *Offline-first*: kebun tidak punya sinyal. Aplikasi mandor harus jalan penuh offline lalu sinkron.
- *Regulatory*: ISPO/RSPO/EUDR + pajak (PPN, PPh 22 pembelian TBS) + laporan ke Ditjenbun.
- *Konsekuensi mahal*: salah hitung rendemen = kerugian ratusan juta/bulan; gagal traceability = ekspor ditolak.

**e. AI tidak bisa short-cut ini.**
Model bahasa bisa menulis modul akuntansi sawit dalam sehari. Yang tidak bisa dilakukannya: duduk 3 hari di pos timbang jam 2 pagi, melihat cara asisten pabrik menolak muatan, dan mengerti kenapa potongan sortasi dinegosiasikan ulang setiap panen raya. **Itu aset yang kita bangun, bukan kodenya.**

### Wedge (titik masuk) — jangan bangun ERP penuh dulu

Masuk lewat **satu titik nyeri yang paling berdarah: pos timbang + sortasi + traceability TBS.**

```
Fase 1 (bulan 1–4)  : Weighbridge & Sortasi
                      tiket timbang digital, integrasi indikator timbangan,
                      sortasi + potongan, harga kontrak supplier,
                      rekap pembelian TBS, cetak nota, anti-kecurangan
                      (foto/CCTV per transaksi, audit trail)
                      -> dijual sebagai produk berdiri sendiri

Fase 2 (bulan 4–8)  : Kebun & Panen (offline-first mobile)
                      blok/afdeling, taksasi, panen harian, BJR,
                      upah & premi panen, angkutan, restan
                      -> menghubungkan asal TBS ke tiket timbang = traceability

Fase 3 (bulan 8–14) : Produksi PKS & Ketertelusuran
                      neraca massa, rendemen CPO/PK, losses, stok tangki,
                      dispatch CPO, laporan ISPO/RSPO/EUDR (poligon + mass balance)

Fase 4 (bulan 12+)  : Core ERP
                      inventory & sparepart, maintenance pabrik, pembelian,
                      keuangan & akuntansi, HR/payroll pekerja harian
```

Fase 1 saja sudah bisa dijual. Itu kuncinya: **jangan menjual ERP, jual pemecah masalah yang hari ini bikin owner kehilangan uang** — lalu ERP-nya tumbuh dari situ.

### Model bisnis
- Lisensi per pabrik/site + per user lapangan, bukan per modul.
- Biaya implementasi & kalibrasi hardware (ini sekaligus barrier untuk pesaing).
- Add-on: laporan kepatuhan ISPO/RSPO/EUDR (langganan terpisah, marjin tinggi).
- Target ARPU realistis: puluhan juta/bulan per grup pabrik menengah.

### Risiko utama
| Risiko | Mitigasi |
|---|---|
| Siklus jual lambat, keputusan di owner | Masuk lewat Fase 1 yang ROI-nya terlihat < 3 bulan (pengurangan kecurangan timbang) |
| Perlu orang lapangan, bukan cuma developer | Rekrut/partner 1 eks-asisten pabrik atau kepala tata usaha PKS sejak hari pertama. **Ini syarat mutlak.** |
| Harga CPO turun -> belanja IT ditunda | Posisikan sebagai penghemat biaya + syarat ekspor, bukan proyek IT |
| Integrasi hardware beragam merk | Bangun layer driver terpisah; mulai dari 3 merk indikator terpopuler |
| Geografis tersebar (Riau, Kalteng, Sumut) | Remote-first + partner implementator lokal per region |

---

## 5. Alternatif terbaik #2: ERP Distribusi Farmasi & Alkes (PBF)

Pilih ini kalau ingin **siklus jual lebih cepat** dan **tidak mau kerja di lokasi remote**.

- **Pemaksa regulasi sangat keras**: CDOB wajib, pelaporan ke BPOM, serialisasi/2D barcode per kemasan (track & trace), batch + kadaluarsa wajib, penarikan (recall) harus bisa ditelusuri, obat golongan tertentu punya aturan penyimpanan & pelaporan sendiri. Salah = izin distribusi dicabut. Ini bukan software opsional.
- **Moat**: aturan berubah terus (butuh tim yang mengikuti regulator = biaya berulang yang menghalangi clone), integrasi barcode & cold chain, FEFO wajib, dan integrasi ke sistem apotek/RS pelanggan.
- **Lebih mudah dieksekusi**: semua di gudang & kantor, ada sinyal, siklus jual lebih pendek, pelanggan lebih terstruktur.
- **Lebih sempit** dari sawit dan sedikit lebih ramai di segmen bawah, tapi segmen PBF menengah multi-cabang masih pakai software tua berbasis desktop.

## 6. Alternatif "sniper": ERP Tambang & Quarry

Moat paling ekstrem (SIMBARA, RKAB, royalti PNBP, jembatan timbang, fleet management, blending kualitas), pelanggan paling mampu bayar, pesaing paling sedikit. **Tapi** pasarnya paling sempit dan akses masuknya sangat bergantung relasi. Ambil ini **hanya jika sudah punya koneksi di industri tambang**. Kalau tidak, jangan.

---

## 7. Keputusan yang saya sarankan

> **Bangun ERP rantai pasok sawit, masuk lewat modul jembatan timbang + sortasi + traceability TBS.**
> Kalau dalam 6 minggu tidak berhasil dapat 2 calon pelanggan yang mau jadi design partner (bukan sekadar tertarik — mau memberi akses pabrik dan data), pindah ke opsi PBF farmasi.

### Langkah 30 hari pertama (sebelum menulis kode produksi)
1. Kunci 1 orang domain expert dari industri PKS (advisor/co-founder/konsultan).
2. Wawancara 15 pabrik/kebun. Fokus pertanyaan: *"Bulan lalu, di mana Anda kehilangan uang karena data yang salah?"*
3. Kunjungi 2 pos timbang langsung, catat alurnya menit per menit, foto semua form kertas.
4. Inventarisasi merk indikator timbangan yang dipakai + protokolnya.
5. Baru kemudian: tentukan arsitektur (offline-first sync adalah keputusan teknis terpenting, tentukan di awal — sulit diubah belakangan).

**Prinsip penutup:** di era AI, keunggulan bukan pada seberapa cepat kita bisa membangun ERP, tapi pada **seberapa dalam kita tahu apa yang harus dibangun**. Kode adalah bagian yang murah. Jangan habiskan keunggulan kompetitif di sana.
