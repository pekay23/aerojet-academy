import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Testing simplified classes query...')
  try {
    const classes = await prisma.class.findMany({
      include: {
        course: true,
      },
      orderBy: { startDate: 'desc' },
    })
    console.log('Query successful! Found', classes.length, 'classes.')
  } catch (error) {
    console.error('Query failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()


