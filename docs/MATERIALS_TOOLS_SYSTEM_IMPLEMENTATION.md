# Implementasi Sistem Materials vs Tools - DisaTools

## Overview

Dokumen ini menjelaskan implementasi perubahan fundamental pada sistem DisaTools untuk membedakan antara **Materials** (bahan habis pakai) dan **Tools** (alat yang dapat dipinjam). Perubahan ini mengubah paradigma sistem dari peminjaman universal menjadi sistem yang lebih spesifik dan sesuai dengan kebutuhan operasional.

## Perubahan Fundamental

### 1. Konsep Baru

#### Materials (Bahan Habis Pakai)
- **Karakteristik**: Sekali pakai, langsung habis setelah digunakan
- **Workflow**: Request → Approve → Consume
- **Tidak ada proses return**: Stok langsung berkurang saat diminta
- **Tracking**: Konsumsi dan penggunaan

#### Tools (Alat Pinjam)
- **Karakteristik**: Dapat dipinjam dan dikembalikan
- **Workflow**: Borrow → Use → Return
- **Ada proses return**: Stok temporary berkurang saat dipinjam
- **Tracking**: Siklus peminjaman dan pengembalian

### 2. Perubahan Database Schema

#### Enum Baru
```sql
-- Tipe kategori
enum CategoryType {
  MATERIAL    // Sekali pakai
  TOOL        // Bisa dipinjam
}

-- Status transaksi unified
enum TransactionStatus {
  ACTIVE      // Sedang dipinjam (tools) / Diproses (materials)
  RETURNED    // Dikembalikan (tools only)
  CONSUMED    // Habis dipakai (materials only)
  OVERDUE     // Terlambat (tools only)
  CANCELLED   // Dibatalkan
}

-- Tipe transaksi
enum TransactionType {
  BORROWING   // Peminjaman tools
  REQUEST     // Permintaan materials
}
```

#### Tabel Baru
- **transactions**: Unified system untuk materials dan tools
- **transaction_items**: Detail item dalam transaksi
- **categories.type**: Field baru untuk membedakan MATERIAL/TOOL

#### Backward Compatibility
- Tabel `borrowings` dan `borrowing_items` tetap dipertahankan
- Enum `BorrowingStatus` tetap ada untuk kompatibilitas

### 3. Perubahan API Backend

#### Endpoint Baru
- `POST /api/transactions` - Unified endpoint untuk materials dan tools
- `POST /api/transactions/[id]/return` - Return tools
- `GET /api/reports/comprehensive` - Laporan gabungan

#### Endpoint yang Diupdate
- `GET /api/dashboard` - KPI baru untuk materials vs tools
- `GET /api/categories` - Support CategoryType
- `GET /api/transactions` - Filter berdasarkan type

## Perubahan Frontend

### 1. Halaman Inventory

#### Fitur Baru
- **Tab Navigation**: Materials dan Tools terpisah
- **Persistent Checkout**: Item tetap di checkout saat ganti tab
- **Smart Contextual Sidebar**: Form berbeda untuk materials vs tools
- **Type-specific Actions**: Aksi sesuai dengan tipe item

#### UI Changes
```typescript
// Tab switching
const [activeTab, setActiveTab] = useState<'materials' | 'tools'>('materials')

// Persistent checkout
const [checkoutItems, setCheckoutItems] = useState<Set<string>>(new Set())

// Smart actions based on item type
const getSmartActions = () => {
  const allMaterials = selected.every(item => item.category?.type === CategoryType.MATERIAL)
  const allTools = selected.every(item => item.category?.type === CategoryType.TOOL)
  // ... logic untuk aksi yang sesuai
}
```

### 2. Halaman Activities (formerly Borrowing)

#### Perubahan Nama dan Struktur
- **Nama**: Borrowing → Activities
- **URL**: `/borrowing` → `/activities`
- **Navigation**: Update sidebar navigation

#### Tab Baru
1. **Tools**: Peminjaman tools aktif
2. **Materials**: Permintaan materials yang sudah diproses
3. **Riwayat**: Semua aktivitas yang selesai

#### Fitur Baru
- **Date Filters**: Filter tanggal untuk Materials dan Riwayat
- **Bulk Actions**: Export dan hapus untuk riwayat
- **Status Indicators**: Visual yang berbeda untuk materials vs tools

### 3. Halaman Reports

#### Jenis Laporan Baru
1. **Semua Aktivitas**: Gabungan semua transaksi
2. **Tools**: Khusus peminjaman tools
3. **Materials**: Khusus permintaan materials
4. **Kondisi & Utilisasi**: Gabungan kondisi, kerusakan, dan utilisasi

#### Fitur Baru
- **Preview Tabel**: Tampilan preview data sebelum download
- **Simplified Filters**: Hanya filter tanggal
- **Comprehensive Report**: API baru untuk laporan gabungan

### 4. Dashboard Updates

#### KPI Cards Baru
- **Primary KPIs**: Total Barang, Materials, Tools, Stok Rendah
- **Activity KPIs**: Tools Dipinjam, Terlambat, Permintaan Materials Hari Ini, Peminjaman Tools Hari Ini

#### Activity Types Baru
- `MATERIAL_REQUESTED`: Material diminta
- `MATERIAL_CONSUMED`: Material terpakai
- `ITEM_DAMAGED`: Item rusak
- `ITEM_LOST`: Item hilang

### 5. Calendar Integration

#### Activity Categorization
- **Color Coding**: Warna berbeda untuk materials vs tools
- **Unified Events**: Gabungan activities dan transactions
- **Enhanced Metadata**: Informasi lebih detail untuk setiap event

## Migration dan Setup

### 1. Database Migration

```bash
# Generate Prisma client
npx prisma generate

# Push schema changes
npx prisma db push

# Update existing data
node scripts/update-categories.js
```

### 2. Sample Data

Script `update-categories.js` akan:
- Update kategori existing dengan field `type`
- Tambah kategori baru untuk materials dan tools
- Buat sample items untuk testing

### 3. Environment Setup

Tidak ada perubahan environment variables yang diperlukan.

## Testing

### 1. Functional Testing

#### Materials Flow
1. ✅ Buka halaman Inventory → Tab Materials
2. ✅ Pilih materials → Add to checkout
3. ✅ Klik "Proses" → Form material request
4. ✅ Submit → Stok langsung berkurang
5. ✅ Cek Activities → Tab Materials

#### Tools Flow
1. ✅ Buka halaman Inventory → Tab Tools
2. ✅ Pilih tools → Add to checkout
3. ✅ Klik "Proses" → Form tool borrowing
4. ✅ Submit → Status ACTIVE
5. ✅ Cek Activities → Tab Tools → Return

#### Reports
1. ✅ Buka Reports → Pilih jenis laporan
2. ✅ Set filter tanggal
3. ✅ Lihat preview tabel
4. ✅ Download PDF/Excel

### 2. Integration Testing

#### API Endpoints
- ✅ `POST /api/transactions` - Materials dan Tools
- ✅ `POST /api/transactions/[id]/return` - Return tools
- ✅ `GET /api/dashboard` - KPI baru
- ✅ `GET /api/reports/comprehensive` - Laporan gabungan

#### Database Consistency
- ✅ Schema migration berhasil
- ✅ Data existing tetap utuh
- ✅ Backward compatibility terjaga

## Deployment Checklist

### Pre-deployment
- [x] Database schema updated
- [x] Sample data migrated
- [x] All tests passing
- [x] Documentation complete

### Deployment Steps
1. **Backup Database**: Backup database production
2. **Deploy Code**: Deploy ke production
3. **Run Migration**: `npx prisma db push`
4. **Update Data**: `node scripts/update-categories.js`
5. **Verify**: Test critical flows

### Post-deployment
- [ ] Monitor error logs
- [ ] Verify all features working
- [ ] User acceptance testing
- [ ] Performance monitoring

## Breaking Changes

### API Changes
- Beberapa endpoint baru memerlukan field tambahan
- Response format dashboard berubah
- Activity types baru ditambahkan

### UI Changes
- URL `/borrowing` berubah menjadi `/activities`
- Navigation menu updated
- Form structures berubah

### Database Changes
- Field `type` ditambahkan ke `categories`
- Tabel `transactions` dan `transaction_items` baru
- Enum baru ditambahkan

## Rollback Plan

Jika terjadi masalah:

1. **Rollback Code**: Revert ke commit sebelumnya
2. **Restore Database**: Restore dari backup
3. **Verify**: Test sistem kembali normal

## Support dan Maintenance

### Monitoring
- Monitor API response times
- Track error rates
- Monitor database performance

### Maintenance Tasks
- Regular cleanup old transactions
- Monitor storage usage
- Update documentation as needed

---

**Implementasi Selesai**: 2025-01-04
**Version**: 2.0.0
**Status**: ✅ Ready for Production
