import prisma from '@/lib/prisma/client'
import { Prisma } from '@prisma/client'
import { format } from 'date-fns'
import { sendPoolConfirmedEmail, sendPoolFailedEmail } from '@/lib/email/service'
import { logAuditEvent } from '../audit/logger'

export async function confirmPoolInternal(poolId: string, tx: any) {
  const memberships = await tx.poolMembership.findMany({
    where: { poolId, status: 'RESERVED' },
    include: {
      user: { include: { profile: true } },
      examComponent: { include: { course: true } },
    },
  })

  const pool = await tx.examPool.findUnique({ where: { id: poolId } })

  for (const m of memberships) {
    const captureAmount = Number(m.amountReserved) || Number(pool?.seatPrice) || 300

    // Capture funds: deduct from balance, release from reserved
    await tx.wallet.update({
      where: { userId: m.userId },
      data: {
        balance: { decrement: captureAmount },
        reservedBalance: { decrement: captureAmount },
      },
    })

    const wallet = await tx.wallet.findUnique({ where: { userId: m.userId } })
    await tx.walletTransaction.create({
      data: {
        walletId: wallet!.id,
        type: 'CAPTURE',
        amount: captureAmount,
        description: `Exam fee captured: ${pool?.name}`,
        referenceId: `CAPTURE-${poolId.substring(0, 8)}`,
        referenceType: 'POOL_CAPTURE',
        balanceBefore: Number(wallet!.balance) + captureAmount,
        balanceAfter: Number(wallet!.balance),
      },
    })

    await tx.poolMembership.update({
      where: { id: m.id },
      data: { status: 'CONFIRMED', amountPaid: captureAmount },
    })
  }

  // Set pool status — CONFIRMED if under max, LOCKED if at capacity
  const updatedPool = await tx.examPool.findUnique({ where: { id: poolId } })
  const finalStatus =
    updatedPool && updatedPool.currentMemberCount >= updatedPool.maxCandidates
      ? 'LOCKED'
      : 'CONFIRMED'

  await tx.examPool.update({
    where: { id: poolId },
    data: { status: finalStatus, confirmedAt: new Date() },
  })

  // Log the audit event
  await logAuditEvent(
    {
      action: 'POOL_CONFIRM',
      entity: 'ExamPool',
      entityId: poolId,
      description: `Pool "${pool?.name}" has been confirmed and seats locked.`,
    },
    tx
  )

  // Send emails (non-blocking, outside tx)
  for (const m of memberships) {
    const name = m.user.profile?.firstName || 'Student'
    const moduleLabel = m.examComponent?.course?.code || 'Module'
    const amount = Number(m.amountPaid || m.amountReserved || 300)

    // Send to personal email
    sendPoolConfirmedEmail(
      m.user.email,
      name,
      pool?.name || '',
      moduleLabel,
      format(pool?.examDate || new Date(), 'dd MMM yyyy'),
      amount
    ).catch((e) =>
      console.error('[EMAIL ERROR] Failed to send pool confirmed email to personal address:', e)
    )

    // Send to academy email if exists
    if (m.user.academyEmail) {
      sendPoolConfirmedEmail(
        m.user.academyEmail,
        name,
        pool?.name || '',
        moduleLabel,
        format(pool?.examDate || new Date(), 'dd MMM yyyy'),
        amount
      ).catch((e) =>
        console.error('[EMAIL ERROR] Failed to send pool confirmed email to academy address:', e)
      )
    }
  }
}

export async function failPool(poolId: string, txClient?: Prisma.TransactionClient) {
  const execute = async (tx: Prisma.TransactionClient) => {
    const pool = await tx.examPool.findUnique({ where: { id: poolId } })
    if (!pool) return null

    const memberships = await tx.poolMembership.findMany({
      where: { poolId, status: 'RESERVED' },
      include: { user: { include: { profile: true } } },
    })

    for (const m of memberships) {
      const releaseAmount = Number(m.amountReserved) || Number(pool.seatPrice) || 300

      // Release reserved funds back to available balance
      await tx.wallet.update({
        where: { userId: m.userId },
        data: {
          reservedBalance: { decrement: releaseAmount },
          availableBalance: { increment: releaseAmount },
        },
      })

      const wallet = await tx.wallet.findUnique({ where: { userId: m.userId } })
      await tx.walletTransaction.create({
        data: {
          walletId: wallet!.id,
          type: 'RELEASE',
          amount: releaseAmount,
          description: `Pool failed - funds released: ${pool.name}`,
          referenceId: `RELEASE-${poolId.substring(0, 8)}`,
          referenceType: 'POOL_RELEASE',
          balanceBefore: Number(wallet!.balance),
          balanceAfter: Number(wallet!.balance),
        },
      })

      await tx.poolMembership.update({ where: { id: m.id }, data: { status: 'CANCELLED' } })
    }

    await tx.examPool.update({ where: { id: poolId }, data: { status: 'FAILED' } })

    await logAuditEvent(
      {
        action: 'POOL_FAIL',
        entity: 'ExamPool',
        entityId: poolId,
        description: `Pool "${pool.name}" has failed Go/No-Go criteria. All funds released.`,
      },
      tx
    )

    return { pool, memberships }
  }

  // Run inside provided transaction or create a new one
  const result = txClient
    ? await execute(txClient)
    : await prisma.$transaction(execute, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      })

  // Send emails OUTSIDE the transaction to avoid blocking on I/O
  if (result?.memberships) {
    for (const m of result.memberships) {
      const name = m.user.profile?.firstName || 'Student'

      // Send to personal email
      sendPoolFailedEmail(
        m.user.email,
        name,
        result.pool.name,
        format(result.pool.examDate, 'dd MMM yyyy')
      ).catch((e) =>
        console.error('[EMAIL ERROR] Failed to send pool failed email to personal address:', e)
      )

      // Send to academy email if exists
      if (m.user.academyEmail) {
        sendPoolFailedEmail(
          m.user.academyEmail,
          name,
          result.pool.name,
          format(result.pool.examDate, 'dd MMM yyyy')
        ).catch((e) =>
          console.error('[EMAIL ERROR] Failed to send pool failed email to academy address:', e)
        )
      }
    }
  }
}
