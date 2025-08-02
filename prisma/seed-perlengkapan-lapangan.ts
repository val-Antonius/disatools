import { PrismaClient } from '@prisma/client'
import { ItemStatus } from '../src/types'
import { perlengkapanLapanganData } from './perlengkapan_lapangan'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting Perlengkapan Lapangan seeding...')

  // Find or create category
  let category = await prisma.category.findUnique({
    where: { name: 'Perlengkapan Lapangan' }
  })

  if (!category) {
    category = await prisma.category.create({
      data: {
        name: 'Perlengkapan Lapangan',
        description: 'Peralatan untuk pekerjaan lapangan'
      }
    })
  }

  // Find or create location
  let location = await prisma.location.findUnique({
    where: { name: 'Gudang Utama' }
  })

  if (!location) {
    location = await prisma.location.create({
      data: {
        name: 'Gudang Utama',
        description: 'Gudang penyimpanan utama'
      }
    })
  }

  // Create items
  for (const item of perlengkapanLapanganData) {
    // Check if item already exists
    const existingItem = await prisma.item.findFirst({
      where: {
        name: item.name,
        categoryId: category.id
      }
    })

    if (!existingItem) {
      await prisma.item.create({
        data: {
          name: item.name,
          description: item.description,
          stock: item.stock,
          minStock: item.minStock,
          status: item.stock > 0 ? ItemStatus.AVAILABLE : ItemStatus.OUT_OF_STOCK,
          categoryId: category.id,
          locationId: location.id
        }
      })
    } else {
      // Update existing item
      await prisma.item.update({
        where: { id: existingItem.id },
        data: {
          description: item.description,
          stock: item.stock,
          minStock: item.minStock,
          status: item.stock > 0 ? ItemStatus.AVAILABLE : ItemStatus.OUT_OF_STOCK,
          locationId: location.id
        }
      })
    }
  }

  console.log(`✅ Successfully seeded ${perlengkapanLapanganData.length} Perlengkapan Lapangan items!`)
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
