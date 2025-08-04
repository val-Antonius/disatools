-- Migration untuk menambahkan sistem Materials vs Tools
-- Tanggal: 2025-01-04

-- 1. Tambah enum CategoryType
ALTER TABLE `categories` ADD COLUMN `type` ENUM('MATERIAL', 'TOOL') NOT NULL DEFAULT 'TOOL';

-- 2. Update kategori yang ada menjadi MATERIAL atau TOOL
-- Asumsi: Elektronik, Furniture, Kendaraan = TOOL
-- Alat Tulis, Peralatan = bisa keduanya, default MATERIAL untuk consumables
UPDATE `categories` SET `type` = 'MATERIAL' WHERE `name` IN ('Alat Tulis');
UPDATE `categories` SET `type` = 'TOOL' WHERE `name` IN ('Elektronik', 'Furniture', 'Kendaraan', 'Peralatan');

-- 3. Tambah kategori baru untuk materials dan tools
INSERT INTO `categories` (`id`, `name`, `type`, `description`, `createdAt`, `updatedAt`) VALUES
('cat_materials_office', 'Bahan Kantor', 'MATERIAL', 'Bahan habis pakai untuk keperluan kantor', NOW(), NOW()),
('cat_materials_safety', 'Bahan Keselamatan', 'MATERIAL', 'Bahan habis pakai untuk keselamatan kerja', NOW(), NOW()),
('cat_tools_network', 'Peralatan Jaringan', 'TOOL', 'Peralatan jaringan yang dapat dipinjam', NOW(), NOW()),
('cat_tools_measurement', 'Alat Ukur', 'TOOL', 'Alat ukur dan testing yang dapat dipinjam', NOW(), NOW());

-- 4. Buat tabel transactions (unified system)
CREATE TABLE `transactions` (
  `id` VARCHAR(191) NOT NULL,
  `type` ENUM('BORROWING', 'REQUEST') NOT NULL,
  `requesterName` VARCHAR(191) NOT NULL,
  `purpose` VARCHAR(191) NOT NULL,
  `transactionDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `returnDate` DATETIME(3) NULL,
  `expectedReturnDate` DATETIME(3) NULL,
  `consumedDate` DATETIME(3) NULL,
  `status` ENUM('ACTIVE', 'RETURNED', 'CONSUMED', 'OVERDUE', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
  `notes` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 5. Buat tabel transaction_items
CREATE TABLE `transaction_items` (
  `id` VARCHAR(191) NOT NULL,
  `transactionId` VARCHAR(191) NOT NULL,
  `itemId` VARCHAR(191) NOT NULL,
  `quantity` INT NOT NULL,
  `returnedQuantity` INT NOT NULL DEFAULT 0,
  `consumedQuantity` INT NOT NULL DEFAULT 0,
  `damagedQuantity` INT NOT NULL DEFAULT 0,
  `lostQuantity` INT NOT NULL DEFAULT 0,
  `status` ENUM('ACTIVE', 'RETURNED', 'CONSUMED', 'OVERDUE', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
  `condition` ENUM('GOOD', 'DAMAGED', 'LOST', 'INCOMPLETE') NULL,
  `returnNotes` TEXT NULL,
  `notes` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `transaction_items_transactionId_fkey` (`transactionId`),
  INDEX `transaction_items_itemId_fkey` (`itemId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 6. Tambah foreign key constraints
ALTER TABLE `transaction_items` ADD CONSTRAINT `transaction_items_transactionId_fkey` FOREIGN KEY (`transactionId`) REFERENCES `transactions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `transaction_items` ADD CONSTRAINT `transaction_items_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- 7. Update activities table untuk mendukung transactions
ALTER TABLE `activities` ADD COLUMN `transactionId` VARCHAR(191) NULL;
ALTER TABLE `activities` ADD INDEX `activities_transactionId_fkey` (`transactionId`);
ALTER TABLE `activities` ADD CONSTRAINT `activities_transactionId_fkey` FOREIGN KEY (`transactionId`) REFERENCES `transactions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- 8. Migrate existing borrowings ke transactions (optional, untuk backward compatibility)
-- INSERT INTO `transactions` (
--   `id`, `type`, `requesterName`, `purpose`, `transactionDate`, 
--   `returnDate`, `expectedReturnDate`, `status`, `notes`, `createdAt`, `updatedAt`
-- )
-- SELECT 
--   CONCAT('trans_', `id`), 'BORROWING', `borrowerName`, `purpose`, `borrowDate`,
--   `returnDate`, `expectedReturnDate`, 
--   CASE 
--     WHEN `status` = 'ACTIVE' THEN 'ACTIVE'
--     WHEN `status` = 'RETURNED' THEN 'RETURNED'
--     WHEN `status` = 'OVERDUE' THEN 'OVERDUE'
--   END,
--   `notes`, `createdAt`, `updatedAt`
-- FROM `borrowings`;

-- 9. Sample data untuk testing materials dan tools
INSERT INTO `items` (`id`, `name`, `description`, `stock`, `minStock`, `status`, `categoryId`, `locationId`, `createdAt`, `updatedAt`) VALUES
-- Materials (consumables)
('item_paper_a4', 'Kertas A4', 'Kertas A4 80gsm untuk printer', 500, 50, 'AVAILABLE', 'cat_materials_office', (SELECT id FROM locations LIMIT 1), NOW(), NOW()),
('item_toner_hp', 'Toner HP LaserJet', 'Toner cartridge untuk printer HP', 10, 2, 'AVAILABLE', 'cat_materials_office', (SELECT id FROM locations LIMIT 1), NOW(), NOW()),
('item_mask_n95', 'Masker N95', 'Masker pelindung N95', 100, 20, 'AVAILABLE', 'cat_materials_safety', (SELECT id FROM locations LIMIT 1), NOW(), NOW()),

-- Tools (borrowable)
('item_laptop_dell', 'Laptop Dell Latitude', 'Laptop untuk keperluan mobile', 5, 1, 'AVAILABLE', 'cat_tools_network', (SELECT id FROM locations LIMIT 1), NOW(), NOW()),
('item_multimeter', 'Digital Multimeter', 'Alat ukur listrik digital', 3, 1, 'AVAILABLE', 'cat_tools_measurement', (SELECT id FROM locations LIMIT 1), NOW(), NOW()),
('item_projector', 'Projector Epson', 'Projector untuk presentasi', 2, 1, 'AVAILABLE', 'cat_tools_network', (SELECT id FROM locations LIMIT 1), NOW(), NOW());
