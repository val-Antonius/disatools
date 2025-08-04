const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function simplifyCategories() {
  try {
    console.log('🧹 Simplifying categories to only Materials and Tools...')

    // First, let's see what categories exist
    const existingCategories = await prisma.category.findMany({
      include: {
        _count: {
          select: { items: true }
        }
      }
    })

    console.log('Current categories:')
    existingCategories.forEach(cat => {
      console.log(`- ${cat.name} (${cat.type}) - ${cat._count.items} items`)
    })

    // Create or update the two main categories
    const materialCategory = await prisma.category.upsert({
      where: { name: 'Materials' },
      update: { 
        type: 'MATERIAL',
        description: 'Bahan habis pakai untuk keperluan operasional'
      },
      create: {
        name: 'Materials',
        type: 'MATERIAL',
        description: 'Bahan habis pakai untuk keperluan operasional'
      }
    })

    const toolCategory = await prisma.category.upsert({
      where: { name: 'Tools' },
      update: { 
        type: 'TOOL',
        description: 'Peralatan yang dapat dipinjam dan dikembalikan'
      },
      create: {
        name: 'Tools',
        type: 'TOOL',
        description: 'Peralatan yang dapat dipinjam dan dikembalikan'
      }
    })

    console.log('✓ Created/updated main categories')

    // Move all items to appropriate main categories
    const materialCategories = existingCategories.filter(cat => 
      cat.type === 'MATERIAL' && cat.name !== 'Materials'
    )
    
    const toolCategories = existingCategories.filter(cat => 
      cat.type === 'TOOL' && cat.name !== 'Tools'
    )

    // Move items from material categories to main Materials category
    for (const cat of materialCategories) {
      if (cat._count.items > 0) {
        await prisma.item.updateMany({
          where: { categoryId: cat.id },
          data: { categoryId: materialCategory.id }
        })
        console.log(`✓ Moved ${cat._count.items} items from "${cat.name}" to "Materials"`)
      }
    }

    // Move items from tool categories to main Tools category
    for (const cat of toolCategories) {
      if (cat._count.items > 0) {
        await prisma.item.updateMany({
          where: { categoryId: cat.id },
          data: { categoryId: toolCategory.id }
        })
        console.log(`✓ Moved ${cat._count.items} items from "${cat.name}" to "Tools"`)
      }
    }

    // Delete old categories (except the main ones)
    const categoriesToDelete = existingCategories.filter(cat => 
      cat.name !== 'Materials' && cat.name !== 'Tools'
    )

    for (const cat of categoriesToDelete) {
      try {
        await prisma.category.delete({
          where: { id: cat.id }
        })
        console.log(`✓ Deleted category: ${cat.name}`)
      } catch (error) {
        console.log(`✗ Could not delete category ${cat.name}:`, error.message)
      }
    }

    console.log('✅ Category simplification completed!')
    console.log('Final categories:')
    console.log('- Materials (MATERIAL) - Bahan habis pakai')
    console.log('- Tools (TOOL) - Peralatan yang dapat dipinjam')

  } catch (error) {
    console.error('❌ Error simplifying categories:', error)
  } finally {
    await prisma.$disconnect()
  }
}

simplifyCategories()
