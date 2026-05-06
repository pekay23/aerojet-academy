import { randomUUID } from 'crypto'
import prisma from '@/lib/prisma/client'

function fallbackText(value: string | null | undefined, fallback: string) {
  const trimmed = value?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : fallback
}

async function backfillWalletTransactions() {
  const transactions = await prisma.walletTransaction.findMany({
    where: {
      OR: [
        { referenceType: null },
        { referenceType: '' },
        { referenceId: null },
        { referenceId: '' },
        { description: null },
        { description: '' },
      ],
    },
    select: {
      id: true,
      type: true,
      referenceType: true,
      referenceId: true,
      description: true,
    },
  })

  for (const tx of transactions) {
    const referenceType = fallbackText(tx.referenceType, `${tx.type}_BACKFILL`)
    await prisma.walletTransaction.update({
      where: { id: tx.id },
      data: {
        referenceType,
        referenceId: fallbackText(tx.referenceId, `${referenceType}-${tx.id}`),
        description: fallbackText(tx.description, `${tx.type} wallet transaction`),
      },
    })
  }

  return transactions.length
}

async function backfillPayments() {
  const payments = await prisma.payment.findMany({
    where: {
      OR: [
        { referenceCode: null },
        { referenceCode: '' },
        { referenceType: null },
        { referenceType: '' },
        { referenceId: null },
        { referenceId: '' },
        { notes: null },
        { notes: '' },
      ],
    },
    select: {
      id: true,
      referenceCode: true,
      referenceType: true,
      referenceId: true,
      notes: true,
      paymentMethod: true,
    },
  })

  for (const payment of payments) {
    const referenceType = fallbackText(payment.referenceType, 'PAYMENT_BACKFILL')
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        referenceCode: fallbackText(payment.referenceCode, `PAY-${payment.id}-${randomUUID()}`),
        referenceType,
        referenceId: fallbackText(payment.referenceId, `${referenceType}-${payment.id}`),
        notes: fallbackText(payment.notes, `Backfilled ${payment.paymentMethod} payment reference`),
      },
    })
  }

  return payments.length
}

async function backfillExamResults() {
  const results = await prisma.examResult.findMany({
    where: {
      OR: [
        { attemptType: null },
        { attemptType: '' },
        { migrationRef: null },
        { migrationRef: '' },
        { sourceNotes: null },
        { sourceNotes: '' },
      ],
    },
    select: {
      id: true,
      userId: true,
      moduleCode: true,
      attemptType: true,
      migrationRef: true,
      sourceNotes: true,
    },
  })

  for (const result of results) {
    const moduleCode = fallbackText(result.moduleCode, 'UNKNOWN_MODULE')
    await prisma.examResult.update({
      where: { id: result.id },
      data: {
        attemptType: fallbackText(result.attemptType, 'FIRST'),
        migrationRef: fallbackText(
          result.migrationRef,
          `BACKFILL:${result.userId}:${moduleCode}:${result.id}`
        ),
        sourceNotes: fallbackText(result.sourceNotes, 'Backfilled legacy exam result metadata'),
      },
    })
  }

  return results.length
}

async function main() {
  const [walletTransactions, payments, examResults] = await Promise.all([
    backfillWalletTransactions(),
    backfillPayments(),
    backfillExamResults(),
  ])

  console.log('Backfill complete')
  console.log(`Wallet transactions updated: ${walletTransactions}`)
  console.log(`Payments updated: ${payments}`)
  console.log(`Exam results updated: ${examResults}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
