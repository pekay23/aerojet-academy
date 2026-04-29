const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const id = 'cmoafksby0002hofgxotog6q2'
  console.log('Testing update for ID:', id)
  
  try {
    const res = await prisma.examResult.update({
      where: { id },
      data: { examCategory: 'INTERNAL' }
    })
    console.log('Update success:', res)
  } catch (err) {
    console.error('Update failed:', err)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
