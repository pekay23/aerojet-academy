#!/usr/bin/env tsx
/**
 * Clean up old uploaded files and expired data
 * Usage: npx tsx scripts/cleanup-old-files.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Starting cleanup...')
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  // Clean old read notifications
  const deletedNotifs = await prisma.notification.deleteMany({
    where: { isRead: true, createdAt: { lt: thirtyDaysAgo } },
  })
  console.log(`  Deleted ${deletedNotifs.count} old read notifications`)

  // Clean old audit logs only after long-term retention.
  const auditRetentionDays = 3650
  const auditCutoff = new Date(Date.now() - auditRetentionDays * 24 * 60 * 60 * 1000)
  const deletedLogs = await prisma.auditLog.deleteMany({
    where: { createdAt: { lt: auditCutoff } },
  })
  console.log(`  Deleted ${deletedLogs.count} old audit logs`)

  console.log('✅ Cleanup complete')
}

main()
  .catch((e) => {
    console.error('❌ Cleanup failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())


