import { PrismaClient } from '@prisma/client'
import { ItemStatus } from '../src/types'
import { perlengkapanKeselamatanData } from './perlengkapan_keselamatan'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting Perlengkapan Keselamatan seeding...')

  // Find or create category
  let category = await prisma.category.findUnique({
    where: { name: 'Perlengkapan Keselamatan' }
  })

  if (!category) {
    category = await prisma.category.create({
      data: {
        name: 'Perlengkapan Keselamatan',
        description: 'Peralatan keselamatan kerja'
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
  for (const item of perlengkapanKeselamatanData) {
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

  console.log(`✅ Successfully seeded ${perlengkapanKeselamatanData.length} Perlengkapan Keselamatan items!`)
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
