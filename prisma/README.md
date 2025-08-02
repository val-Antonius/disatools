# Database Seeding Guide

## Overview
Project ini menggunakan Prisma untuk manajemen database dan seeding. Terdapat beberapa file seeder yang dapat dijalankan untuk mengisi database dengan data awal.

## File Seeder

### 1. Main Seeder (`seed.ts`)
File seeder utama yang mengisi database dengan semua data dari semua kategori perlengkapan.

**Cara menjalankan:**
```bash
npm run db:seed
```

### 2. Individual Seeders
File seeder individual untuk setiap kategori perlengkapan:

#### Perlengkapan Kantor
```bash
npm run db:perlengkapan_kantor
```

#### Perlengkapan Jaringan
```bash
npm run db:perlengkapan_jaringan
```

#### Perlengkapan Lapangan
```bash
npm run db:perlengkapan_lapangan
```

#### Perlengkapan Keselamatan
```bash
npm run db:perlengkapan_keselamatan
```

## Data Files

### Data Source Files
- `perlengkapan_kantor.ts` - Data perlengkapan kantor
- `perlengkapan_jaringan.ts` - Data perlengkapan jaringan
- `perlengkapan_lapangan.ts` - Data perlengkapan lapangan
- `perlengkapan_keselamatan.ts` - Data perlengkapan keselamatan

### Format Data
Setiap file data mengexport array dengan format:
```typescript
export const [categoryName]Data = [
  {
    name: string,
    description: string,
    stock: number,
    minStock: number,
    category: string,
    location: string
  }
]
```

## Database Commands

### Reset Database
```bash
npm run db:reset
```
Menghapus semua data dan menjalankan seeder utama.

### Generate Prisma Client
```bash
npm run db:generate
```

### Push Schema Changes
```bash
npm run db:push
```

### Run Migrations
```bash
npm run db:migrate
```

### Open Prisma Studio
```bash
npm run db:studio
```

## Troubleshooting

### Error: Missing script
Jika mendapat error "Missing script", pastikan:
1. Script sudah ditambahkan di `package.json`
2. File seeder ada di folder `prisma/`
3. Nama script sesuai dengan yang ada di `package.json`

### Error: Module not found
Jika mendapat error module not found:
1. Pastikan semua dependencies sudah terinstall: `npm install`
2. Generate Prisma client: `npm run db:generate`

### Error: Database connection
Jika ada error koneksi database:
1. Pastikan database server berjalan
2. Cek konfigurasi `DATABASE_URL` di file `.env`
3. Pastikan database sudah dibuat

## Notes
- Individual seeder menggunakan `upsert` sehingga aman dijalankan berulang kali
- Main seeder akan menghapus semua data existing sebelum mengisi ulang
- Semua seeder akan membuat kategori dan lokasi jika belum ada
