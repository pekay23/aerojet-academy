#!/usr/bin/env tsx
/**
 * Rollback Script: Undo Exam Candidate Migration
 * =================================================
 * Removes all data created by the migration script for a given migration ref.
 *
 * Usage:
 *   npx dotenv-cli -e .env -- tsx scripts/rollback-exam-candidates.ts
 *
 * WARNING: This deletes users, wallets, bookings, and entitlements
 * created by the migration. It will NOT delete users that existed
 * before the migration (it checks audit logs).
 */
import prisma from '../lib/prisma/client'

const MIGRATION_REF = 'EXAM_CANDIDATE_IMPORT_2026_03'

async function main() {
  console.log('='.repeat(60))
  console.log('ROLLBACK: Exam Candidate Migration')
  console.log(`Migration Ref: ${MIGRATION_REF}`)
  console.log('='.repeat(60))

  // Step 1: Remove exam bookings created by migration
  const deletedBookings = await prisma.examBooking.deleteMany({
    where: { migrationRef: { startsWith: MIGRATION_REF } },
  })
  console.log(`Deleted ${deletedBookings.count} exam bookings`)

  // Step 2: Remove booking entitlements with migration notes
  const deletedEntitlements = await prisma.bookingEntitlement.deleteMany({
    where: { notes: { startsWith: '[Migration]' } },
  })
  console.log(`Deleted ${deletedEntitlements.count} booking entitlements`)

  // Step 3: Remove migration wallet transactions and reverse balances
  const migrationTxns = await prisma.walletTransaction.findMany({
    where: {
      referenceType: 'migration',
      referenceId: MIGRATION_REF,
    },
    include: { wallet: true },
  })

  for (const txn of migrationTxns) {
    const amount = txn.amount.toNumber()
    if (amount > 0) {
      await prisma.wallet.update({
        where: { id: txn.walletId },
        data: {
          balance: { decrement: amount },
          availableBalance: { decrement: amount },
        },
      })
      console.log(`Reversed wallet credit of €${amount} for wallet ${txn.walletId}`)
    }
  }

  const deletedTxns = await prisma.walletTransaction.deleteMany({
    where: {
      referenceType: 'migration',
      referenceId: MIGRATION_REF,
    },
  })
  console.log(`Deleted ${deletedTxns.count} wallet transactions`)

  // Step 4: Find users created by this migration via audit logs
  const migrationAuditLogs = await prisma.auditLog.findMany({
    where: {
      action: 'IMPORT',
      entity: 'users',
      description: { contains: 'Migration import' },
      changes: { path: ['migrationRef'], equals: MIGRATION_REF },
    },
  })

  const migratedUserIds = migrationAuditLogs
    .filter((log) => log.entityId)
    .map((log) => log.entityId!)

  console.log(`\nFound ${migratedUserIds.length} users created/updated by migration`)

  // Step 5: Optionally delete users that were CREATED (not just updated) by migration
  // We check if the description says "Created"
  const createdLogs = migrationAuditLogs.filter(
    (log) => log.description?.includes('Created')
  )
  const createdUserIds = createdLogs
    .filter((log) => log.entityId)
    .map((log) => log.entityId!)

  if (createdUserIds.length > 0) {
    console.log(`\nUsers that were CREATED by migration (safe to delete):`)
    for (const userId of createdUserIds) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      })
      if (user) {
        console.log(`  - ${user.profile?.firstName} ${user.profile?.lastName} (${user.email})`)
      }
    }

    console.log(`\nTo delete these users, uncomment the deletion code below and re-run.`)
    // UNCOMMENT TO ACTUALLY DELETE:
    // for (const userId of createdUserIds) {
    //   await prisma.wallet.deleteMany({ where: { userId } })
    //   await prisma.studentProfile.deleteMany({ where: { userId } })
    //   await prisma.profile.deleteMany({ where: { userId } })
    //   await prisma.user.delete({ where: { id: userId } })
    //   console.log(`  Deleted user: ${userId}`)
    // }
  }

  // Step 6: Clean up audit logs for migration
  const deletedAuditLogs = await prisma.auditLog.deleteMany({
    where: {
      action: 'IMPORT',
      entity: 'users',
      changes: { path: ['migrationRef'], equals: MIGRATION_REF },
    },
  })
  console.log(`Deleted ${deletedAuditLogs.count} audit log entries`)

  console.log('\n' + '='.repeat(60))
  console.log('ROLLBACK COMPLETE')
  console.log('Note: User accounts were NOT deleted (safety). Review and delete manually if needed.')
  console.log('='.repeat(60))
}

main()
  .catch((e) => {
    console.error('Rollback failed:', e)
    process.exit(1)
  })
