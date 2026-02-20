#!/usr/bin/env tsx
/**
 * Data migration script — for migrating data between schema versions
 * Usage: npx tsx scripts/migrate-data.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Starting data migration...')

  // Example: Migrate users without profiles
  const usersWithoutProfile = await prisma.user.findMany({
    where: { profile: null },
  })

  for (const user of usersWithoutProfile) {
    await prisma.profile.create({
      data: {
        userId: user.id,
        firstName: 'Unknown',
        lastName: 'User',
      },
    })
    console.log(`  Created profile for user: ${user.email}`)
  }

  // Example: Ensure all students have wallets
  const studentsWithoutWallet = await prisma.user.findMany({
    where: { role: 'STUDENT', wallet: null },
  })

  for (const student of studentsWithoutWallet) {
    await prisma.wallet.create({
      data: { userId: student.id, balance: 0, reservedBalance: 0, currency: 'EUR' },
    })
    console.log(`  Created wallet for student: ${student.email}`)
  }

  console.log('✅ Migration complete')
}

main()
  .catch((e) => { console.error('❌ Migration failed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
