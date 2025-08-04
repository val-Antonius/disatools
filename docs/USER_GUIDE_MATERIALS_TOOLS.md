# Panduan Pengguna: Sistem Materials vs Tools

## Selamat Datang di DisaTools 2.0! 🎉

Sistem DisaTools telah diperbarui dengan fitur baru yang memisahkan **Materials** (bahan habis pakai) dan **Tools** (alat pinjam). Panduan ini akan membantu Anda memahami perubahan dan cara menggunakan fitur-fitur baru.

## Apa yang Berubah?

### Konsep Baru

#### 🧱 Materials (Bahan Habis Pakai)
- **Contoh**: Kertas, toner, masker, bahan kimia
- **Karakteristik**: Sekali pakai, langsung habis
- **Proses**: Minta → Disetujui → Langsung terpakai
- **Tidak perlu dikembalikan**

#### 🔧 Tools (Alat Pinjam)
- **Contoh**: Laptop, proyektor, alat ukur, kendaraan
- **Karakteristik**: Dapat dipinjam dan dikembalikan
- **Proses**: Pinjam → Gunakan → Kembalikan
- **Harus dikembalikan sesuai jadwal**

## Panduan Penggunaan

### 1. Halaman Inventory (Inventaris)

#### Navigasi Tab Baru
- **Tab Materials**: Menampilkan semua bahan habis pakai
- **Tab Tools**: Menampilkan semua alat yang dapat dipinjam

#### Cara Meminta Materials
1. Buka halaman **Inventory**
2. Klik tab **Materials**
3. Pilih materials yang dibutuhkan (centang checkbox)
4. Klik **"Minta Material"** atau tambah ke checkout
5. Isi form permintaan:
   - Nama peminta
   - Tujuan penggunaan
   - Catatan (opsional)
6. Klik **"Proses Permintaan"**
7. ✅ Materials langsung dikurangi dari stok

#### Cara Meminjam Tools
1. Buka halaman **Inventory**
2. Klik tab **Tools**
3. Pilih tools yang akan dipinjam (centang checkbox)
4. Klik **"Pinjam Tool"** atau tambah ke checkout
5. Isi form peminjaman:
   - Nama peminjam
   - Tujuan penggunaan
   - **Tanggal pengembalian** (wajib)
   - Catatan (opsional)
6. Klik **"Proses Peminjaman"**
7. ✅ Tools berstatus "Dipinjam"

#### Fitur Checkout Baru
- **Persistent Checkout**: Item tetap di checkout meski ganti tab
- **Smart Processing**: Sistem otomatis tahu mana materials dan tools
- **Mixed Items Warning**: Peringatan jika mencampur materials dan tools

### 2. Halaman Activities (Aktivitas)

> **Perubahan**: Halaman "Peminjaman" sekarang menjadi "Aktivitas"

#### Tab Baru
1. **Tools**: Peminjaman tools yang sedang aktif
2. **Materials**: Permintaan materials yang sudah diproses
3. **Riwayat**: Semua aktivitas yang sudah selesai

#### Mengelola Peminjaman Tools
1. Buka halaman **Activities**
2. Klik tab **Tools**
3. Lihat daftar tools yang sedang dipinjam
4. Untuk mengembalikan:
   - Klik **"Kembalikan"** pada item
   - Isi form pengembalian:
     - Jumlah yang dikembalikan
     - Kondisi barang
     - Jumlah rusak/hilang (jika ada)
     - Catatan pengembalian
   - Klik **"Proses Pengembalian"**

#### Melihat Riwayat Materials
1. Buka halaman **Activities**
2. Klik tab **Materials**
3. Gunakan filter tanggal untuk mencari
4. Lihat riwayat permintaan materials

#### Mengelola Riwayat
1. Buka halaman **Activities**
2. Klik tab **Riwayat**
3. Pilih aktivitas yang ingin dikelola (centang checkbox)
4. Gunakan tombol:
   - **Export**: Download data ke Excel/PDF
   - **Hapus**: Hapus riwayat yang dipilih

### 3. Halaman Reports (Laporan)

#### Jenis Laporan Baru
1. **Semua Aktivitas**: Gabungan semua transaksi materials dan tools
2. **Tools**: Khusus laporan peminjaman tools
3. **Materials**: Khusus laporan permintaan materials
4. **Kondisi & Utilisasi**: Analisis kondisi barang dan tingkat penggunaan

#### Cara Membuat Laporan
1. Buka halaman **Reports**
2. Pilih jenis laporan yang diinginkan
3. Set filter tanggal (dari - sampai)
4. Klik **"Generate Report"**
5. Lihat **Preview Tabel** untuk memastikan data benar
6. Klik **"Download PDF"** atau **"Download Excel"**

### 4. Dashboard Baru

#### KPI Cards Baru
- **Total Barang**: Jumlah semua items
- **Materials**: Jumlah bahan habis pakai
- **Tools**: Jumlah alat pinjam
- **Stok Rendah**: Items dengan stok di bawah minimum
- **Tools Dipinjam**: Jumlah tools yang sedang dipinjam
- **Terlambat**: Tools yang terlambat dikembalikan
- **Permintaan Materials Hari Ini**: Materials yang diminta hari ini
- **Peminjaman Tools Hari Ini**: Tools yang dipinjam hari ini

#### Aktivitas Terbaru
Dashboard menampilkan aktivitas terbaru dengan kategori:
- 🟦 Peminjaman tools
- 🟣 Permintaan materials
- 🟢 Pengembalian tools
- 🟠 Update stok
- 🔴 Kerusakan/kehilangan

## Tips dan Best Practices

### 📋 Untuk Materials
- ✅ Pastikan stok cukup sebelum meminta
- ✅ Isi tujuan penggunaan dengan jelas
- ✅ Monitor stok rendah secara berkala
- ❌ Jangan meminta berlebihan

### 🔧 Untuk Tools
- ✅ Tentukan tanggal pengembalian yang realistis
- ✅ Kembalikan tepat waktu
- ✅ Laporkan kerusakan segera
- ✅ Isi kondisi barang saat pengembalian
- ❌ Jangan lupa mengembalikan

### 📊 Untuk Laporan
- ✅ Gunakan filter tanggal untuk data spesifik
- ✅ Preview data sebelum download
- ✅ Export secara berkala untuk backup
- ✅ Analisis utilisasi untuk optimasi

## Troubleshooting

### Masalah Umum

#### "Tidak bisa mencampur materials dan tools"
- **Penyebab**: Memilih materials dan tools bersamaan
- **Solusi**: Proses materials dan tools secara terpisah

#### "Stok tidak cukup"
- **Penyebab**: Stok materials habis atau tools sedang dipinjam
- **Solusi**: Cek stok di inventory atau tunggu tools dikembalikan

#### "Tanggal pengembalian wajib diisi"
- **Penyebab**: Meminjam tools tanpa set tanggal pengembalian
- **Solusi**: Isi tanggal pengembalian yang realistis

#### "Item tidak ditemukan di tab"
- **Penyebab**: Item mungkin di tab yang salah
- **Solusi**: Cek kategori item di master data

### Bantuan Lebih Lanjut

Jika mengalami masalah:
1. Cek panduan ini terlebih dahulu
2. Lihat dokumentasi teknis di `docs/`
3. Hubungi administrator sistem
4. Laporkan bug melalui sistem ticketing

## Migrasi Data

### Data Lama
- ✅ Semua data peminjaman lama tetap tersimpan
- ✅ Dapat diakses melalui tab "Riwayat"
- ✅ Laporan lama masih bisa diakses

### Kategori Baru
Sistem otomatis mengupdate kategori:
- **Materials**: Alat Tulis, Bahan Kantor, Bahan Keselamatan
- **Tools**: Elektronik, Furniture, Kendaraan, Peralatan, Peralatan Jaringan, Alat Ukur

## Feedback dan Saran

Kami sangat menghargai feedback Anda untuk perbaikan sistem:
- 📧 Email: admin@disatools.com
- 💬 Chat: Fitur chat di aplikasi
- 📝 Form: Feedback form di dashboard

---

**Selamat menggunakan DisaTools 2.0!** 🚀

*Sistem yang lebih smart, workflow yang lebih efisien, dan tracking yang lebih akurat.*
