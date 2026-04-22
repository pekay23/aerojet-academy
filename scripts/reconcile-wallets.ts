import { TransactionType } from '@prisma/client'
import prisma from '../lib/prisma/client'

async function reconcileWallets() {
  const wallets = await prisma.wallet.findMany({
    include: {
      transactions: true,
      user: {
        select: {
          email: true,
          profile: { select: { firstName: true, lastName: true } },
        },
      },
    },
  })

  let fixedCount = 0
  let totalMissingTopUp = 0
  let totalMissingDebit = 0

  for (const wallet of wallets) {
    let calculatedBalance = 0

    for (const txn of wallet.transactions) {
      const amount = Number(txn.amount)

      switch (txn.type) {
        case 'TOP_UP':
        case 'CREDIT':
        case 'REFUND':
          calculatedBalance += amount
          break
        case 'DEBIT':
        case 'CAPTURE':
        case 'PAYMENT':
          calculatedBalance -= amount
          break
        case 'ADJUSTMENT':
          // Adjustment can be positive or negative
          calculatedBalance += amount
          break
        case 'RESERVE':
        case 'RELEASE':
          // These only move money between available and reserved, total balance stays the same
          break
      }
    }

    const actualBalance = Number(wallet.balance)
    const diff = actualBalance - calculatedBalance

    // We only care if the difference is more than 1 cent
    if (Math.abs(diff) > 0.01) {
      const isMissingDeposit = diff > 0
      
      const type: TransactionType = isMissingDeposit ? 'TOP_UP' : 'DEBIT'
      const amount = Math.abs(diff)

      console.log(`Reconciling wallet for ${wallet.user.email}: Calculated = €${calculatedBalance.toFixed(2)}, Actual = €${actualBalance.toFixed(2)}. Adding ${type} of €${amount.toFixed(2)}`)

      // Create the missing transaction WITHOUT updating the wallet balance itself
      await prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type,
          amount,
          balanceBefore: calculatedBalance,
          balanceAfter: isMissingDeposit ? calculatedBalance + amount : calculatedBalance - amount,
          description: 'Historical Data Import (Auto-reconciled)',
          referenceType: 'system_reconciliation',
          createdBy: null, // System generated
          createdAt: wallet.createdAt, // Backdate to wallet creation
        },
      })

      fixedCount++
      if (isMissingDeposit) totalMissingTopUp += amount
      else totalMissingDebit += amount
    }
  }

  console.log(`\n✅ Reconciliation complete! Fixed ${fixedCount} wallets.`)
  console.log(`   Total Missing Deposits Added: €${totalMissingTopUp.toFixed(2)}`)
  console.log(`   Total Missing Debits Added: €${totalMissingDebit.toFixed(2)}`)

  await prisma.$disconnect()
}

reconcileWallets().catch((e) => {
  console.error('Failed to reconcile wallets:', e)
  process.exit(1)
})
