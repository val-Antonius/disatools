# DisaTools - Inventory Management System

![DisaTools Logo](https://via.placeholder.com/800x200/4A90E2/FFFFFF?text=DisaTools+-+Inventory+Management+System)

DisaTools adalah aplikasi web modern untuk memonitor, mengelola, dan menganalisis inventaris barang di dalam gudang secara efisien. Aplikasi ini menggantikan pencatatan manual dengan sistem digital yang terintegrasi, mengurangi kesalahan, dan memberikan wawasan berbasis data untuk optimalisasi stok dan ruang gudang.

## 🚀 Fitur Utama

### 📊 Dashboard Real-time
- KPI cards dengan data real-time (Total Barang, Stok Rendah, Barang Dipinjam, Overdue)
- Log aktivitas terbaru
- Ringkasan cepat inventaris

### 📦 Manajemen Inventaris
- CRUD operations untuk data barang
- Sistem kategori dan lokasi
- Tracking stok dengan alert minimum
- Search dan filter advanced
- Sorting pada semua kolom

### 🔄 Sistem Peminjaman
- Pencatatan peminjaman dengan detail lengkap
- Tracking durasi dan deadline
- Proses pengembalian otomatis
- Notifikasi overdue
- History peminjaman

### 📈 Analitik & Visualisasi
- Grafik distribusi kategori
- Chart barang paling sering dipinjam
- Trend peminjaman bulanan
- Insights dan rekomendasi

### 📋 Reporting
- Generate laporan PDF dan Excel
- Filter berdasarkan periode dan kategori
- Template laporan siap pakai
- Preview data sebelum export

### 📅 Kalender Interaktif
- Tampilan aktivitas bulanan
- Color-coded indicators
- Detail aktivitas per tanggal
- Navigation antar bulan

## 🛠️ Teknologi Stack

- **Frontend**: Next.js 15.4.4, React 19, TypeScript
- **Styling**: Tailwind CSS v4 dengan Glassmorphism theme
- **Backend**: Next.js API Routes
- **Database**: MySQL dengan Prisma ORM
- **Charts**: Chart.js dengan React Chart.js 2
- **Icons**: Lucide React
- **Export**: jsPDF (PDF), xlsx (Excel)

## 📋 Prerequisites

Pastikan Anda memiliki software berikut terinstall:

- Node.js (v18 atau lebih baru)
- npm atau yarn
- MySQL Server
- Git

## 🚀 Installation & Setup

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/disatools.git
cd disatools
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Database
Buat database MySQL baru:
```sql
CREATE DATABASE disatools;
```

### 4. Environment Configuration
Edit file `.env` dan sesuaikan konfigurasi database:
```env
DATABASE_URL="mysql://username:password@localhost:3306/disatools"
```

### 5. Database Migration & Seeding
```bash
# Generate Prisma client
npm run db:generate

# Push schema ke database
npm run db:push

# Seed database dengan data awal
npm run db:seed
```

### 6. Run Development Server
```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint

# Database
npm run db:generate     # Generate Prisma client
npm run db:push         # Push schema to database
npm run db:migrate      # Run database migrations
npm run db:seed         # Seed database with initial data
npm run db:reset        # Reset database and reseed
npm run db:studio       # Open Prisma Studio
```

## 📊 Database Schema

### Tabel Utama
- **categories**: Kategori barang
- **locations**: Lokasi/rak penyimpanan
- **items**: Data barang inventaris
- **borrowings**: Data peminjaman
- **activities**: Log aktivitas sistem

### Relasi
- Item belongs to Category dan Location
- Borrowing belongs to Item
- Activity dapat terkait dengan Item dan/atau Borrowing

## 🎯 Roadmap Pengembangan

Proyek ini dikembangkan dalam 4 fase:

### ✅ Fase 1: Foundation & Database
- Setup Prisma ORM dan MySQL
- Database schema dan migrations
- Basic UI components
- Project structure

### ✅ Fase 2: Dashboard & Inventory Management
- Dashboard dengan KPI real-time
- CRUD operations untuk items
- Search dan filter functionality
- Master data management

### 🚧 Fase 3: Borrowing System & Analytics
- Sistem peminjaman terintegrasi
- Analytics dengan visualisasi data
- Notification system
- Advanced tracking features

### 📅 Fase 4: Reporting & Polish
- Sistem reporting (PDF/Excel)
- Kalender interaktif
- UI/UX improvements
- Performance optimization

## 📝 License

This project is licensed under the MIT License.

---

**DisaTools** - Transforming Inventory Management with Modern Technology 🚀
