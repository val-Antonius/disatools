const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateCategories() {
  try {
    console.log('Updating categories with type field...')

    // Update existing categories
    const updates = [
      { name: 'Elektronik', type: 'TOOL' },
      { name: 'Furniture', type: 'TOOL' },
      { name: 'Kendaraan', type: 'TOOL' },
      { name: 'Alat Tulis', type: 'MATERIAL' },
      { name: 'Peralatan', type: 'TOOL' }
    ]

    for (const update of updates) {
      try {
        await prisma.category.updateMany({
          where: { name: update.name },
          data: { type: update.type }
        })
        console.log(`✓ Updated ${update.name} to ${update.type}`)
      } catch (error) {
        console.log(`- Category ${update.name} not found, skipping`)
      }
    }

    // Add new categories for materials and tools
    const newCategories = [
      { name: 'Bahan Kantor', type: 'MATERIAL', description: 'Bahan habis pakai untuk keperluan kantor' },
      { name: 'Bahan Keselamatan', type: 'MATERIAL', description: 'Bahan habis pakai untuk keselamatan kerja' },
      { name: 'Peralatan Jaringan', type: 'TOOL', description: 'Peralatan jaringan yang dapat dipinjam' },
      { name: 'Alat Ukur', type: 'TOOL', description: 'Alat ukur dan testing yang dapat dipinjam' }
    ]

    for (const category of newCategories) {
      try {
        const existing = await prisma.category.findUnique({
          where: { name: category.name }
        })

        if (!existing) {
          await prisma.category.create({
            data: category
          })
          console.log(`✓ Created new category: ${category.name} (${category.type})`)
        } else {
          console.log(`- Category ${category.name} already exists`)
        }
      } catch (error) {
        console.log(`✗ Error creating category ${category.name}:`, error.message)
      }
    }

    // Add sample items for testing
    const sampleItems = [
      // Materials
      { name: 'Kertas A4', description: 'Kertas A4 80gsm untuk printer', stock: 500, minStock: 50, categoryName: 'Bahan Kantor' },
      { name: 'Toner HP LaserJet', description: 'Toner cartridge untuk printer HP', stock: 10, minStock: 2, categoryName: 'Bahan Kantor' },
      { name: 'Masker N95', description: 'Masker pelindung N95', stock: 100, minStock: 20, categoryName: 'Bahan Keselamatan' },
      
      // Tools
      { name: 'Laptop Dell Latitude', description: 'Laptop untuk keperluan mobile', stock: 5, minStock: 1, categoryName: 'Peralatan Jaringan' },
      { name: 'Digital Multimeter', description: 'Alat ukur listrik digital', stock: 3, minStock: 1, categoryName: 'Alat Ukur' },
      { name: 'Projector Epson', description: 'Projector untuk presentasi', stock: 2, minStock: 1, categoryName: 'Peralatan Jaringan' }
    ]

    // Get first location for sample items
    const firstLocation = await prisma.location.findFirst()
    if (!firstLocation) {
      console.log('No locations found, creating default location...')
      await prisma.location.create({
        data: {
          name: 'Gudang Utama',
          description: 'Lokasi penyimpanan utama'
        }
      })
    }

    const location = await prisma.location.findFirst()

    for (const item of sampleItems) {
      try {
        const category = await prisma.category.findUnique({
          where: { name: item.categoryName }
        })

        if (category) {
          const existing = await prisma.item.findFirst({
            where: { name: item.name }
          })

          if (!existing) {
            await prisma.item.create({
              data: {
                name: item.name,
                description: item.description,
                stock: item.stock,
                minStock: item.minStock,
                categoryId: category.id,
                locationId: location.id,
                status: 'AVAILABLE'
              }
            })
            console.log(`✓ Created sample item: ${item.name}`)
          } else {
            console.log(`- Item ${item.name} already exists`)
          }
        }
      } catch (error) {
        console.log(`✗ Error creating item ${item.name}:`, error.message)
      }
    }

    console.log('\n✅ Categories and sample data updated successfully!')

  } catch (error) {
    console.error('Error updating categories:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateCategories()
