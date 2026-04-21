import { prismaBase } from '../lib/prisma/db-base'

async function verifyAuthData() {
  console.log('[DIAGNOSTIC] Checking database connectivity through prismaBase...')
  try {
    const userCount = await prismaBase.user.count()
    console.log('[DIAGNOSTIC] Total Users:', userCount)
    
    // Check if the user we're trying to log in as exists
    const adminUser = await prismaBase.user.findFirst({
      where: { email: { equals: 'admin@aerojet-academy.com', mode: 'insensitive' } },
      select: { id: true, email: true, status: true, role: true }
    })
    
    if (adminUser) {
      console.log('[DIAGNOSTIC] SUCCESS: Found admin user:', adminUser)
    } else {
      console.log('[DIAGNOSTIC] WARNING: Admin user NOT FOUND in database.')
      const sample = await prismaBase.user.findMany({ 
        take: 3, 
        orderBy: { createdAt: 'desc' },
        select: { email: true, role: true } 
      })
      console.log('[DIAGNOSTIC] Sample users in DB:', sample)
    }
  } catch (err: any) {
    console.error('[DIAGNOSTIC] FAILED to connect:', err.message)
  } finally {
    process.exit(0)
  }
}

verifyAuthData()
