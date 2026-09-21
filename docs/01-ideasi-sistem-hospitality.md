# Ideasi: Sistem Apa yang Relevan untuk Industri Hospitality

> Status: dokumen ideasi. Belum ada keputusan, belum ada validasi lapangan.
> Lanjutan dari [`00-analisa-pemilihan-vertikal-erp.md`](00-analisa-pemilihan-vertikal-erp.md) — memakai kerangka moat yang sama supaya bisa dibandingkan apple-to-apple.

---

## 0. Peringatan jujur di depan

Di dokumen 00, hospitality **tidak masuk daftar kandidat** — dan itu bukan kelalaian. Hospitality secara umum adalah zona merah:

- PMS (property management system) dan POS restoran adalah kategori **paling ramai** di Indonesia dan harganya sudah jatuh.
- Sebagian besar fiturnya persis jenis yang dikomoditisasi AI: booking, kalender kamar, folio, invoice, POS, laporan occupancy.
- Konsekuensi salah hitung relatif murah (salah invoice = revisi, bukan ekspor ditolak).

**Jadi kalau masuk hospitality, jangan masuk lewat pintu depan.** Membangun "PMS + POS + channel manager" = bunuh diri. Yang masih terbuka adalah **bagian yang tidak disentuh PMS**: uang bocor di belakang layar, unit yang tersebar, uang milik pihak ketiga, dan kepatuhan pajak daerah.

Dokumen ini memetakan di mana titik-titik itu.

---

## 1. Peta industri: siapa saja "hospitality" itu

Jangan diperlakukan sebagai satu pasar. Minimal ada 7 segmen dengan masalah yang berbeda total:

| Segmen | Ciri operasional | Sistem yang dipakai hari ini |
|---|---|---|
| Hotel berbintang (chain) | SOP ketat, corporate | Opera/Protel + Material Control, sudah terkunci |
| Hotel menengah & butik independen | 20–120 kamar, owner-operated | PMS lokal murah + Excel untuk semua sisanya |
| Villa / homestay dikelola operator | Puluhan unit tersebar, **milik orang lain** | Excel + WhatsApp + channel manager |
| Resort & glamping remote | Sinyal buruk, logistik berat | Excel, buku tulis |
| Restoran & cafe grup | Multi-outlet, food cost tinggi | POS ramai-ramai, stok tidak akurat |
| Katering & central kitchen | Produksi batch, pengiriman harian | Excel + WA |
| MICE / banquet / event organizer | BEO, sewa venue, vendor | Word + Excel |

Uang paling besar per pelanggan ada di **operator multi-unit** dan **grup F&B** — bukan di hotel tunggal.

---

## 2. Di mana sebenarnya uang bocor (ini yang layak dijual)

Wawancara awal apa pun di industri ini akan memunculkan lima keluhan yang sama. Perhatikan: **tak satu pun diselesaikan PMS.**

1. **Food & beverage cost tidak pernah akurat.** Resep tidak terstandar, yield bahan mentah (susut potong, susut masak) tidak dihitung, stock opname bulanan tidak cocok, waste tidak tercatat. Food cost "seharusnya" 30% tapi nyatanya 38% dan tidak ada yang bisa menunjukkan bocornya di mana.
2. **Rekonsiliasi OTA berantakan.** Booking dari Booking.com/Agoda/Traveloka/Airbnb masuk, komisi dipotong, payout datang bergelombang dan tidak per-booking. Mencocokkan payout ↔ reservasi ↔ komisi ↔ refund adalah neraka Excel bulanan.
3. **Laporan ke pemilik unit (owner statement) memakan berhari-hari.** Operator villa mengelola properti milik orang lain dengan skema bagi hasil. Tiap bulan harus terbit laporan per unit: revenue, komisi OTA, biaya operasional, maintenance, listrik, bagi hasil. Dikerjakan manual, sering salah, dan **setiap salah = konflik dengan pemilik**.
4. **Tenaga harian (daily worker/casual) tidak terkontrol.** Housekeeping dan banquet pakai DW. Jadwal, absensi, dan upah dihitung manual. Ini pos biaya terbesar kedua setelah F&B.
5. **Pajak daerah (PB1/PHR 10%) dan pelaporan tamu asing.** Tapping box Bapenda, e-SPTPD yang formatnya beda tiap kabupaten/kota, dan kewajiban lapor tamu WNA ke Imigrasi (APOA). Ini administratif, membosankan, dan wajib.

Poin 1, 2, 3 adalah **kehilangan uang langsung**. Itu yang dibeli owner. Poin 4 dan 5 adalah penyerta.

---

## 3. Evaluasi moat: mana yang tidak gampang di-clone AI

Memakai 5 moat dari dokumen 00 (regulatory, hardware, proses tacit, offline, konsekuensi mahal):

| Ide sistem | Moat yang dipunya | Catatan |
|---|---|---|
| Cost control F&B / central kitchen | Tacit (resep, yield, susut), konsekuensi mahal | Rumus yield beda tiap dapur; tidak ada di internet |
| Operator multi-unit + owner statement | Konsekuensi mahal (uang pihak ketiga), switching cost ekstrem | Data historis bagi hasil = tidak mungkin pindah sistem |
| Layer kepatuhan PHR + tapping box + APOA | Regulatory kuat (500+ Bapenda, format beda-beda) | Moat tertinggi, tapi ARPU rendah kalau dijual sendiri |
| Resort/glamping remote ops | Offline-first, logistik | Pasar terlalu sempit untuk jadi produk utama |
| Banquet/MICE (BEO) & katering | Tacit (BEO, costing event, vendor) | Sepi pemain, tapi tiket kecil |
| PMS / channel manager / booking engine | **Tidak ada** | Jangan |
| POS restoran | **Tidak ada** | Jangan |
| HRIS hotel generik | **Tidak ada** | Jangan |

Skor 1–5, rubrik sama dengan dokumen 00:

| # | Kandidat | Moat AI | Luas | Sepi | ARPU | Cepat | Total |
|---|---|---|---|---|---|---|---|
| 1 | **Operator multi-unit villa/resort (owner statement + rekonsiliasi OTA)** | 4 | 3 | 5 | 4 | 4 | **20** |
| 2 | **Cost control F&B & central kitchen (back of house)** | 4 | 5 | 4 | 3 | 4 | **20** |
| 3 | Layer kepatuhan pajak daerah + APOA | 5 | 5 | 4 | 2 | 3 | 19 |
| 4 | Banquet/MICE + katering (BEO to invoice) | 3 | 3 | 5 | 3 | 4 | 18 |
| 5 | Manajemen tenaga harian & payroll hospitality | 3 | 4 | 4 | 2 | 4 | 17 |
| 6 | Tour operator / DMC (allotment, series, komisi agen) | 3 | 3 | 4 | 3 | 4 | 17 |
| 7 | Kos / co-living / apartemen sewa | 2 | 4 | 3 | 2 | 4 | 15 |
| 8 | PMS + channel manager generik | 2 | 5 | 1 | 2 | 3 | 13 |
| 9 | POS restoran generik | 1 | 5 | 1 | 1 | 4 | 12 |

Bandingkan dengan dokumen 00: sawit 22, farmasi 21, tambang 21. **Hospitality terbaik ada di angka 20** — sedikit di bawah, dengan trade-off yang jelas: moat lebih tipis, tapi siklus jual lebih cepat, lokasi lebih nyaman, dan jauh lebih mudah cari design partner. Kalau akses/relasi Anda ada di hospitality (Bali, Lombok, Labuan Bajo, Jogja, Bandung), angka 20 yang bisa dieksekusi mengalahkan angka 22 yang tidak bisa dimasuki.

---

## 4. Rekomendasi utama: ERP Operator Properti Multi-Unit

**Target pelanggan:** perusahaan manajemen villa/homestay/resort yang mengelola 15–300 unit **milik pemilik lain** dengan skema bagi hasil. Banyak sekali di Bali, dan menyebar ke Lombok, Labuan Bajo, Jogja, Bandung, Batu.

### Kenapa ini

**a. Mereka memegang uang orang lain.** Begitu sebuah sistem menjadi sumber kebenaran untuk bagi hasil pemilik, sistem itu tidak akan diganti — riwayat pembayarannya ada di sana, dan pemilik unit akan protes kalau angkanya berubah. Ini switching cost yang setara dengan data historis di dokumen 00.

**b. Rasa sakitnya bulanan dan terukur.** Tutup buku 5–10 hari kerja tiap bulan hanya untuk menerbitkan owner statement. Itu gaji 2–3 orang yang bisa ditunjukkan hilangnya.

**c. Incumbent-nya salah sasaran.** PMS dan channel manager berhenti di reservasi. Software akuntansi tidak mengerti "unit milik siapa, bagi hasil berapa persen, biaya mana yang ditanggung pemilik vs operator". Tidak ada yang menutup celah di tengah. Persis pola celah "jembatan timbang vs akuntansi" di sawit.

**d. Rekonsiliasi OTA adalah pekerjaan yang tidak bisa ditebak AI.** Setiap OTA punya siklus payout, format laporan, aturan komisi, pajak, dan penanganan refund/no-show yang berbeda — dan berubah. Mengikuti itu adalah biaya berulang yang menghalangi clone (moat yang sama dengan "aturan regulator berubah terus" di farmasi).

**e. Sisanya menyusul dengan sendirinya.** Sekali memegang revenue dan biaya per unit, maintenance, housekeeping, procurement, dan payroll DW tinggal tumbuh dari situ.

### Wedge — jangan bangun ERP penuh dulu

Masuk lewat **titik yang paling berdarah: rekonsiliasi OTA + owner statement otomatis.**

```
Fase 1 (bulan 1–3)  : Revenue & Owner Statement
                      tarik reservasi dari channel manager/OTA,
                      rekonsiliasi payout vs booking vs komisi vs refund,
                      master unit + skema bagi hasil per pemilik,
                      biaya per unit, owner statement PDF + portal pemilik
                      -> dijual berdiri sendiri, ROI terlihat bulan pertama

Fase 2 (bulan 3–6)  : Operasi Lapangan (mobile, toleran sinyal buruk)
                      housekeeping board, checklist turnover, laundry,
                      work order maintenance + foto, inventaris amenity,
                      jadwal & absensi tenaga harian

Fase 3 (bulan 6–10) : Uang & Kepatuhan
                      AP/AR, kas bank per entitas, trust account pemilik,
                      PB1/PHR + e-SPTPD, lapor tamu asing (APOA),
                      pajak final sewa & PPh pemilik

Fase 4 (bulan 10+)  : Ekspansi
                      F&B outlet dalam properti (pakai modul cost control),
                      revenue management sederhana, pembelian terpusat,
                      akuntansi penuh multi-entitas
```

Fase 1 saja sudah produk. Prinsip yang sama dengan dokumen 00: **jangan menjual ERP, jual penghenti kebocoran.**

### Model bisnis
- Langganan **per unit yang dikelola per bulan** — tumbuh otomatis saat pelanggan tumbuh, dan selaras dengan cara mereka menghitung bisnis sendiri.
- Minimum charge per operator + biaya onboarding (migrasi data historis bagi hasil = sekaligus barrier untuk pesaing).
- Add-on: portal pemilik berlabel merek operator, modul kepatuhan pajak daerah.
- Hindari model per-user: staf hospitality turnover-nya tinggi, per-user bikin mereka menahan jumlah akun dan merusak adopsi.

### Risiko utama

| Risiko | Mitigasi |
|---|---|
| Integrasi OTA/channel manager tidak resmi atau dibatasi | Fase 1 mulai dari **import file laporan OTA** (CSV/Excel) — tidak butuh izin siapa pun; integrasi API menyusul lewat channel manager sebagai mitra |
| Pasar lebih sempit dari sawit | Terima; kompensasinya siklus jual pendek. Uji: bisa dapat 3 operator berbayar dalam 3 bulan atau tidak |
| Operator kecil mau bayar murah | Target yang mengelola ≥25 unit ke atas. Di bawah itu mereka memang belum sakit |
| Musiman — low season, belanja ditahan | Harga per unit dikelola, bukan per transaksi; tagihan tetap jalan saat sepi |
| Banyak pemain global vacation rental software | Mereka tidak mengerti bagi hasil pemilik ala Indonesia, PB1 per-daerah, APOA, dan tenaga harian. Itu titik diferensiasi, bukan fitur tambahan |

---

## 5. Alternatif terbaik #2: Cost Control F&B & Central Kitchen

Pilih ini kalau ingin **pasar yang jauh lebih luas** (semua hotel, semua grup restoran, semua katering) dan tidak ingin bergantung pada satu geografi wisata.

- **Isinya**: resep standar berjenjang (sub-resep), yield & susut per bahan, harga bahan bergerak, food cost aktual vs teoretis, stock opname multi-gudang, waste log, purchase request → PO → penerimaan, dan menu engineering (margin vs popularitas).
- **Moat**: rumus yield dan konversi satuan (karung → kg → porsi) berbeda tiap dapur dan hanya ada di kepala chef/cost controller. Timbangan digital di receiving. Konsekuensi salah = selisih food cost 5–8% dari omzet, angka yang langsung dimengerti owner.
- **Kenapa sepi**: incumbent kelas atas (Material Control, Adaco, FMC) mahal dan berat; pemain POS lokal berhenti di "stok berkurang saat menu terjual" yang tidak pernah akurat.
- **Kelemahan**: ARPU lebih rendah, dan harus hati-hati agar tidak terseret jadi "POS lagi". **Jangan bangun POS — integrasikan ke POS yang sudah dipakai pelanggan.**

## 6. Yang sebaiknya jadi add-on, bukan produk utama: Layer Kepatuhan

PB1/PHR, tapping box Bapenda, e-SPTPD tiap daerah, dan APOA untuk tamu asing punya **moat regulasi tertinggi di seluruh daftar** — tapi kemauan bayarnya rendah kalau dijual sendiri (dianggap "kewajiban", bukan "keuntungan"). Strateginya: bangun sebagai modul berlangganan terpisah **di atas** produk utama, seperti add-on ISPO/RSPO/EUDR di dokumen sawit.

## 7. Alternatif "sniper": Banquet/MICE & Katering

BEO masih dibuat di Word, costing event dikira-kira, dan vendor dikelola lewat WhatsApp. Sangat sepi pemain. Tapi tiketnya kecil dan pelanggannya tersebar. Ambil **hanya kalau** sudah punya akses ke grup hotel atau perusahaan katering yang mau jadi design partner sejak awal.

---

## 8. Yang JANGAN dibangun di hospitality

- **PMS / channel manager / booking engine generik** — paling ramai, harga sudah jatuh, dan persis yang mudah dibuat AI.
- **POS restoran** — pasar habis, marjin nol.
- **Aplikasi pemesanan untuk tamu (B2C)** — ini bisnis marketplace, bukan ERP, dan lawannya OTA global.
- **"All-in-one hotel suite"** — janji besar, jual susah, implementasi mati.
- **HRIS/payroll hospitality generik** — jadikan modul, bukan produk.

---

## 9. Cara memutuskan: hospitality atau tetap sawit?

Ini bukan soal mana yang lebih bagus di atas kertas, tapi mana yang **pintunya terbuka untuk Anda**.

| Kalau... | Ambil |
|---|---|
| Punya relasi/akses ke PKS atau perkebunan | Sawit (dokumen 00) — moat dan ARPU-nya lebih tinggi |
| Punya relasi di operator villa/hotel/grup F&B, atau berbasis di destinasi wisata | Hospitality — rekomendasi bab 4 |
| Tidak punya keduanya, dan ingin siklus jual cepat | Hospitality bab 5 (cost control F&B) — paling mudah dapat pelanggan pertama |
| Ingin ticket besar dan tahan modal panjang | Sawit atau farmasi |

**Hospitality dan sawit tidak saling meniadakan dalam hal teknis** — modul inventory, procurement, akuntansi multi-entitas, dan payroll harian bisa dipakai bersama. Tapi **pilih satu untuk go-to-market**. Dua wedge sekaligus artinya nol wedge.

---

## 10. Langkah 30 hari pertama (kalau hospitality dipilih)

1. Kunci 1 domain expert: eks-GM atau eks-financial controller hotel/operator villa. Syarat mutlak, sama seperti eks-asisten PKS di dokumen 00.
2. Wawancara 15 operator/hotel/grup F&B. Pertanyaan intinya sama: **"Bulan lalu, di mana Anda kehilangan uang karena data yang salah?"** — lalu minta lihat file Excel-nya, jangan hanya dengar jawabannya.
3. Minta 3 contoh owner statement asli dan 3 laporan payout OTA asli. Di dua dokumen inilah seluruh produk Fase 1 sebenarnya sudah tertulis.
4. Inventarisasi tumpukan sistem yang mereka pakai sekarang (PMS apa, channel manager apa, POS apa, akuntansi apa) — produk kita harus **menempel di atasnya**, bukan menggantikannya.
5. Baru tentukan arsitektur. Keputusan teknis terpenting di sini bukan offline-sync seperti sawit, melainkan **model data multi-entitas + bagi hasil + audit trail keuangan**: siapa pemilik apa, biaya siapa, dan setiap angka di statement harus bisa ditelusuri ke transaksi asalnya. Sulit diubah belakangan.

**Prinsip penutup (sama dengan dokumen 00):** yang mahal bukan kodenya. Yang mahal adalah tahu kenapa food cost bocor 8% dan kenapa pemilik villa bertengkar dengan operatornya tiap tanggal 10. Bangun aset itu.
