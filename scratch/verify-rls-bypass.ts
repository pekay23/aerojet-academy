import { PrismaClient } from '@prisma/client'

async function verify() {
  const prisma = new PrismaClient()
  
  console.log('Testing SystemSetting (Should BYPASS RLS wrapper)...')
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'welcome_messages' }
    })
    console.log('SystemSetting Result:', setting ? 'Found' : 'Not Found')
  } catch (err) {
    console.error('SystemSetting Test Failed:', err)
  }

  console.log('\nTesting User (Should USE RLS wrapper)...')
  try {
    const user = await prisma.user.findFirst({
      select: { id: true, email: true }
    })
    console.log('User Result:', user ? 'Found' : 'Not Found (Expected if no session)')
  } catch (err) {
    console.error('User Test Failed:', err)
  }

  await prisma.$disconnect()
}

verify()
