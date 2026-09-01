import { prismaUnfiltered } from '@/lib/prisma/client'

// Simulate build environment
process.env.NEXT_PHASE = 'phase-production-build'

async function main() {
  console.log('--- Testing Build-Time Database Access ---')
  console.log('Simulation: NEXT_PHASE = phase-production-build')
  
  try {
    // 1. Test System Settings (Should pass due to new public policy)
    console.log('Fetching System Settings...')
    const settings = await (prisma as any).systemSetting.findMany({ take: 1 })
    console.log('✅ Fetched settings successfully')
    
    // 2. Test News Articles (Should pass due to new public policy)
    console.log('Fetching News Articles...')
    const news = await (prisma as any).newsArticle.findMany({ take: 1 })
    console.log('✅ Fetched news successfully')

    // 3. Test Restricted Data (Should pass because extension bypasses RLS in build-phase)
    console.log('Fetching Restricted Data (Wallets)...')
    const wallets = await (prisma as any).wallet.findMany({ take: 1 })
    console.log('✅ Fetched wallets successfully (Bypass worked)')

  } catch (error) {
    console.error('❌ Database access failed:', error)
    process.exit(1)
  } finally {
    await (prisma as any).$disconnect()
  }
}

main()
