import { Prisma, MembershipStatus, PoolStatus, NotificationType } from '@prisma/client'
import { AuditAction } from '@/lib/audit/logger'
import prisma from '@/lib/prisma/client'
import { reserveFunds, captureFunds, releaseFunds } from '@/lib/wallet/operations'
import { createAuditLog } from '@/lib/audit/logger'
import { createNotification } from '@/lib/email/service'

// ---------------------------------------------------------------------------
// JOIN POOL — Serializable transaction with row-level lock
// ---------------------------------------------------------------------------

export async function joinPool(
  userId: string,
  poolId: string,
  examComponentId: string,
  actorId?: string
) {
  return prisma.$transaction(
    async (tx) => {
      // 1. LOCK the pool row (SELECT FOR UPDATE)
      const [pool] = await tx.$queryRaw<any[]>`
        SELECT * FROM "ExamPool" WHERE id = ${poolId} FOR UPDATE
      `

      if (!pool) throw new Error('Pool not found')

      // 2. Validate pool status
      if (!['OPEN', 'NEAR_FULL'].includes(pool.status)) {
        throw new Error(`Pool is not accepting bookings (status: ${pool.status})`)
      }

      // 3. Check capacity
      if (pool.currentMemberCount >= pool.maxCandidates) {
        throw new Error('Pool is full')
      }

      // 4. Check if already a member
      const existing = await tx.poolMembership.findUnique({
        where: { poolId_userId: { poolId, userId } },
      })
      if (existing) {
        throw new Error('You are already a member of this pool')
      }

      // 5. Validate module is allowed
      const allowedModules = pool.allowedModules as string[]
      if (allowedModules.length > 0 && !allowedModules.includes(examComponentId)) {
        throw new Error(`Module ${examComponentId} is not available in this pool`)
      }

      // 6. Check module diversity cap
      const moduleDistribution = await tx.poolMembership.groupBy({
        by: ['examComponentId'],
        where: { poolId, status: { not: 'CANCELLED' } },
      })
      const uniqueModules = new Set(moduleDistribution.map((m) => m.examComponentId))
      if (!uniqueModules.has(examComponentId) && uniqueModules.size >= pool.moduleDiversityCap) {
        throw new Error(
          `Pool has reached maximum module diversity (${pool.moduleDiversityCap}). ` +
            `Choose from: ${Array.from(uniqueModules).join(', ')}`
        )
      }

      // 7. Reserve wallet funds
      const seatPrice = Number(pool.seatPrice)
      await reserveFunds(
        tx,
        userId,
        seatPrice,
        `Pool seat reservation: ${pool.name}`,
        `POOL-${poolId}`
      )

      // 8. Create membership
      const membership = await tx.poolMembership.create({
        data: {
          poolId,
          userId,
          examComponentId,
          status: MembershipStatus.RESERVED,
          amountReserved: seatPrice,
        },
      })

      // 9. Increment member count
      const updatedPool = await tx.examPool.update({
        where: { id: poolId },
        data: { currentMemberCount: { increment: 1 } },
      })

      // 10. Check for auto-confirmation (25+ members)
      if (
        updatedPool.currentMemberCount >= updatedPool.minCandidates &&
        pool.status !== 'CONFIRMED'
      ) {
        await confirmPoolInternal(tx, poolId)
      }
      // Update to NEAR_FULL if approaching capacity
      else if (
        updatedPool.currentMemberCount >= updatedPool.minCandidates - 2 &&
        pool.status === 'OPEN'
      ) {
        await tx.examPool.update({
          where: { id: poolId },
          data: { status: PoolStatus.NEAR_FULL },
        })
      }

      // 11. Create notification
      await createNotification(tx, userId, {
        type: NotificationType.SUCCESS,
        title: 'Pool Booking Confirmed',
        message: `You've reserved a seat in ${pool.name} for module ${examComponentId}. €${seatPrice} has been held in your wallet.`,
        link: `/student/exam-pools/my-bookings`,
      })

      return membership
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 15000,
    }
  )
}

// ---------------------------------------------------------------------------
// CONFIRM POOL (internal, called within transaction)
// ---------------------------------------------------------------------------

async function confirmPoolInternal(tx: any, poolId: string) {
  // Update pool status
  await tx.examPool.update({
    where: { id: poolId },
    data: {
      status: PoolStatus.CONFIRMED,
      confirmedAt: new Date(),
    },
  })

  // Get all reserved members
  const members = await tx.poolMembership.findMany({
    where: { poolId, status: MembershipStatus.RESERVED },
    include: { pool: true },
  })

  // Capture funds for each member
  for (const member of members) {
    const amount = Number(member.amountReserved)

    await captureFunds(
      tx,
      member.userId,
      amount,
      `Pool confirmed: ${member.pool.name} - Module ${member.examComponentId}`,
      `POOL-CONFIRM-${poolId}`
    )

    // Update membership status
    await tx.poolMembership.update({
      where: { id: member.id },
      data: {
        status: MembershipStatus.CONFIRMED,
        amountPaid: amount,
        paidAt: new Date(),
        confirmedAt: new Date(),
      },
    })

    // Notify member
    await createNotification(tx, member.userId, {
      type: NotificationType.SUCCESS,
      title: 'Exam Pool Confirmed!',
      message: `${member.pool.name} has been confirmed. €${amount} has been captured from your wallet. Your exam for ${member.examComponentId} is scheduled.`,
      link: `/student/exam-pools/my-bookings`,
    })
  }
}

// ---------------------------------------------------------------------------
// CONFIRM POOL (standalone, for staff manual confirm)
// ---------------------------------------------------------------------------

export async function confirmPool(poolId: string, actorId: string) {
  return prisma.$transaction(
    async (tx) => {
      const pool = await tx.examPool.findUnique({
        where: { id: poolId },
        include: { memberships: true },
      })

      if (!pool) throw new Error('Pool not found')
      if (pool.status === 'CONFIRMED') throw new Error('Pool is already confirmed')

      await confirmPoolInternal(tx, poolId)

      await createAuditLog({
        action: AuditAction.APPROVE,
        entity: 'ExamPool',
        entityId: poolId,
        userId: actorId,
        details: {
          memberCount: pool.currentMemberCount,
          manualConfirm: true,
        },
      })

      return tx.examPool.findUnique({
        where: { id: poolId },
        include: { memberships: true },
      })
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  )
}

// ---------------------------------------------------------------------------
// FAIL POOL (release all held funds)
// ---------------------------------------------------------------------------

export async function failPool(poolId: string, actorId: string) {
  return prisma.$transaction(async (tx) => {
    const pool = await tx.examPool.findUnique({
      where: { id: poolId },
      include: { memberships: { where: { status: MembershipStatus.RESERVED } } },
    })

    if (!pool) throw new Error('Pool not found')
    if (pool.status === 'CONFIRMED') throw new Error('Cannot fail a confirmed pool')

    // Update pool status
    await tx.examPool.update({
      where: { id: poolId },
      data: {
        status: PoolStatus.FAILED,
      },
    })

    // Release funds for each member
    for (const member of pool.memberships) {
      const amount = Number(member.amountReserved)

      await releaseFunds(
        tx,
        member.userId,
        amount,
        `Pool failed: ${pool.name} - Funds released`,
        `POOL-FAIL-${poolId}`
      )

      await tx.poolMembership.update({
        where: { id: member.id },
        data: {
          status: MembershipStatus.CANCELLED,
        },
      })

      await createNotification(tx, member.userId, {
        type: NotificationType.WARNING,
        title: 'Exam Pool Did Not Proceed',
        message: `${pool.name} did not reach the minimum ${pool.minCandidates} candidates. €${amount} has been released back to your wallet.`,
        link: `/student/wallet`,
      })
    }

    return pool as any
  })
}

// ---------------------------------------------------------------------------
// GET POOL DETAILS
// ---------------------------------------------------------------------------

export async function getPoolWithDetails(poolId: string) {
  return prisma.examPool.findUnique({
    where: { id: poolId },
    include: {
      event: true,
      memberships: {
        include: {
          user: {
            include: {
              profile: { select: { firstName: true, lastName: true } },
              studentProfile: { select: { studentId: true } },
            },
          },
          examComponent: {
            include: { course: { select: { code: true } } },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })
}

// ---------------------------------------------------------------------------
// GET AVAILABLE POOLS
// ---------------------------------------------------------------------------

export async function getAvailablePools() {
  return prisma.examPool.findMany({
    where: {
      status: { in: [PoolStatus.OPEN, PoolStatus.NEAR_FULL] },
      examDate: { gt: new Date() },
    },
    include: {
      event: { select: { name: true, startDate: true, endDate: true } },
      _count: { select: { memberships: true } },
    },
    orderBy: { examDate: 'asc' },
  })
}
