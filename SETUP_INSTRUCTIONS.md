# 🚀 DisaTools - Setup Instructions

Panduan lengkap untuk menjalankan aplikasi DisaTools di environment lokal Anda.

## 📋 Prerequisites

Pastikan Anda memiliki software berikut terinstall:

- **Node.js** (v18 atau lebih baru) - [Download](https://nodejs.org/)
- **MySQL Server** - [Download](https://dev.mysql.com/downloads/mysql/)
- **Git** - [Download](https://git-scm.com/)
- **Code Editor** (VS Code recommended) - [Download](https://code.visualstudio.com/)

## 🛠️ Step-by-Step Setup

### 1. Verifikasi Prerequisites
```bash
# Check Node.js version
node --version
# Should show v18.x.x or higher

# Check npm version
npm --version

# Check MySQL
mysql --version
```

### 2. Setup Database MySQL

#### Option A: Using MySQL Command Line
```sql
-- Login ke MySQL
mysql -u root -p

-- Buat database baru
CREATE DATABASE disatools;

-- Verifikasi database dibuat
SHOW DATABASES;

-- Exit MySQL
EXIT;
```

#### Option B: Using phpMyAdmin (XAMPP/WAMP)
1. Buka phpMyAdmin di browser: `http://localhost/phpmyadmin`
2. Klik "New" untuk membuat database baru
3. Nama database: `disatools`
4. Collation: `utf8mb4_general_ci`
5. Klik "Create"

### 3. Clone & Setup Project
```bash
# Clone repository (jika dari Git)
git clone <repository-url>
cd disatools

# Atau jika sudah ada folder project
cd disatools

# Install dependencies
npm install
```

### 4. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit file .env dengan text editor
# Sesuaikan DATABASE_URL dengan kredensial MySQL Anda
```

**Contoh konfigurasi .env:**
```env
# Untuk MySQL dengan password
DATABASE_URL="mysql://root:your_password@localhost:3306/disatools"

# Untuk MySQL tanpa password (XAMPP default)
DATABASE_URL="mysql://root:@localhost:3306/disatools"

# Untuk MySQL dengan port custom
DATABASE_URL="mysql://root:password@localhost:3307/disatools"
```

### 5. Database Setup & Migration
```bash
# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Seed database dengan data awal
npm run db:seed
```

**Expected Output:**
```
🌱 Starting database seeding...
🗑️  Cleared existing data
📂 Created categories
📍 Created locations
📦 Created items
📋 Created borrowings
📊 Updated item stocks
📝 Created activities
✅ Database seeding completed successfully!

📊 Summary:
- Categories: 5
- Locations: 6
- Items: 13
- Borrowings: 3
- Activities: 5
```

### 6. Run Development Server
```bash
npm run dev
```

**Expected Output:**
```
▲ Next.js 15.4.4
- Local:        http://localhost:3000
- Environments: .env

✓ Starting...
✓ Ready in 2.3s
```

### 7. Access Application
Buka browser dan akses: `http://localhost:3000`

Anda akan diarahkan ke Dashboard dengan data sample yang sudah di-seed.

## 🎯 Verifikasi Setup

### Checklist Functionality:
- [ ] Dashboard menampilkan KPI cards dengan data
- [ ] Sidebar navigation berfungsi
- [ ] Halaman Inventory menampilkan daftar barang
- [ ] Bisa menambah barang baru
- [ ] Halaman Borrowing menampilkan peminjaman
- [ ] Halaman Analytics menampilkan charts
- [ ] Halaman Reports berfungsi
- [ ] Halaman Calendar menampilkan aktivitas

### Test Basic Operations:
1. **Add New Item**: Inventory → Tambah Barang
2. **Borrow Item**: Borrowing → Pinjam Barang
3. **Return Item**: Borrowing → Kembalikan (pada item aktif)
4. **View Analytics**: Analytics → Lihat charts
5. **Generate Report**: Reports → Download PDF/Excel

## 🔧 Troubleshooting

### Common Issues:

#### 1. Database Connection Error
```
Error: P1001: Can't reach database server
```
**Solution:**
- Pastikan MySQL server berjalan
- Cek kredensial di file `.env`
- Pastikan database `disatools` sudah dibuat

#### 2. Prisma Client Error
```
Error: @prisma/client did not initialize yet
```
**Solution:**
```bash
npm run db:generate
```

#### 3. Seeding Error
```
Error: Table 'disatools.categories' doesn't exist
```
**Solution:**
```bash
npm run db:push
npm run db:seed
```

#### 4. Port Already in Use
```
Error: Port 3000 is already in use
```
**Solution:**
```bash
# Kill process on port 3000
npx kill-port 3000

# Or run on different port
npm run dev -- -p 3001
```

#### 5. Module Not Found
```
Error: Cannot find module 'tsx'
```
**Solution:**
```bash
npm install tsx --save-dev
```

### Reset Database (if needed):
```bash
# Reset database dan seed ulang
npm run db:reset
```

## 📊 Database Management

### Useful Commands:
```bash
# Open Prisma Studio (Database GUI)
npm run db:studio

# Generate Prisma client after schema changes
npm run db:generate

# Apply schema changes to database
npm run db:push

# Create and apply migration
npm run db:migrate

# Reset database completely
npm run db:reset
```

### Prisma Studio:
- URL: `http://localhost:5555`
- GUI untuk melihat dan edit data database
- Sangat berguna untuk debugging

## 🚀 Production Deployment

### Build for Production:
```bash
# Build aplikasi
npm run build

# Start production server
npm run start
```

### Environment Variables for Production:
```env
DATABASE_URL="mysql://username:password@production-host:3306/disatools"
NEXTAUTH_URL="https://your-domain.com"
```

## 📞 Support

Jika mengalami masalah:

1. **Check Console**: Buka Developer Tools (F12) untuk melihat error
2. **Check Terminal**: Lihat error messages di terminal
3. **Check Database**: Gunakan Prisma Studio untuk verifikasi data
4. **Restart Services**: Restart MySQL dan development server

## 🎉 Success!

Jika semua langkah berhasil, Anda sekarang memiliki:
- ✅ Aplikasi DisaTools yang berjalan di `http://localhost:3000`
- ✅ Database MySQL dengan data sample
- ✅ Semua fitur siap digunakan
- ✅ Development environment yang lengkap

**Selamat! DisaTools siap digunakan! 🚀**
