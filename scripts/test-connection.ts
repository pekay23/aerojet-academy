import { prisma } from '../lib/prisma/client'

async function main() {
  console.log('Testing connection...')
  try {
    const settings = await prisma.systemSetting.findMany()
    console.log('SUCCESS: found', settings.length, 'settings')
  } catch (err) {
    console.error('FAILED:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()


