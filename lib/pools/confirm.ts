import prisma from '@/lib/database/prisma'
import { POOL_EXAM_FEE } from './types'
import { sendEmail, poolConfirmedEmail, poolFailedEmail } from '@/lib/email'
import { format } from 'date-fns'

export async function confirmPoolInternal(poolId: string, tx: any) {
  const memberships = await tx.poolMembership.findMany({
    where: { poolId, status: 'RESERVED' },
    include: { user: { include: { profile: true } } },
  })

  const pool = await tx.examPool.findUnique({ where: { id: poolId } })

  for (const m of memberships) {
    // Capture funds: deduct from balance, release from reserved
    await tx.wallet.update({
      where: { userId: m.userId },
      data: {
        balance: { decrement: POOL_EXAM_FEE },
        reservedBalance: { decrement: POOL_EXAM_FEE },
      },
    })

    const wallet = await tx.wallet.findUnique({ where: { userId: m.userId } })
    await tx.walletTransaction.create({
      data: {
        walletId: wallet!.id,
        type: 'PAYMENT',
        amount: POOL_EXAM_FEE,
        description: `Exam fee captured: ${pool?.name}`,
        referenceId: `CAPTURE-${poolId.substring(0, 8)}`,
        referenceType: 'POOL_CAPTURE',
        balanceBefore: Number(wallet!.balance) + POOL_EXAM_FEE,
        balanceAfter: Number(wallet!.balance),
      },
    })

    await tx.poolMembership.update({
      where: { id: m.id },
      data: { status: 'CONFIRMED', amountPaid: POOL_EXAM_FEE },
    })
  }

  await tx.examPool.update({ where: { id: poolId }, data: { status: 'CONFIRMED' } })

  // Send emails (non-blocking, outside tx)
  for (const m of memberships) {
    const name = m.user.profile?.firstName || 'Student'
    sendEmail({
      to: m.user.academyEmail || m.user.email,
      subject: 'Exam Pool Confirmed!',
      html: poolConfirmedEmail(
        name,
        pool?.name || '',
        format(pool?.examDate || new Date(), 'dd MMM yyyy'),
        m.selectedModule
      ),
    }).catch(() => {})
  }
}

export async function failPool(poolId: string) {
  const pool = await prisma.examPool.findUnique({ where: { id: poolId } })
  if (!pool) return

  const memberships = await prisma.poolMembership.findMany({
    where: { poolId, status: 'RESERVED' },
    include: { user: { include: { profile: true } } },
  })

  for (const m of memberships) {
    // Release reserved funds
    await prisma.wallet.update({
      where: { userId: m.userId },
      data: { reservedBalance: { decrement: POOL_EXAM_FEE } },
    })

    const wallet = await prisma.wallet.findUnique({ where: { userId: m.userId } })
    await prisma.walletTransaction.create({
      data: {
        walletId: wallet!.id,
        type: 'RELEASE',
        amount: POOL_EXAM_FEE,
        description: `Pool failed - funds released: ${pool.name}`,
        referenceId: `RELEASE-${poolId.substring(0, 8)}`,
        referenceType: 'POOL_RELEASE',
        balanceBefore: Number(wallet!.balance),
        balanceAfter: Number(wallet!.balance),
      },
    })

    await prisma.poolMembership.update({ where: { id: m.id }, data: { status: 'CANCELLED' } })

    const name = m.user.profile?.firstName || 'Student'
    sendEmail({
      to: m.user.academyEmail || m.user.email,
      subject: 'Exam Pool Did Not Reach Minimum',
      html: poolFailedEmail(name, pool.name, format(pool.examDate, 'dd MMM yyyy')),
    }).catch(() => {})
  }

  await prisma.examPool.update({ where: { id: poolId }, data: { status: 'FAILED' } })
}
