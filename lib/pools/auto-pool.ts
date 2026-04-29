import prisma from '@/lib/prisma/client'
import { Prisma, BookingType } from '@prisma/client'
import { reserveFunds } from '@/lib/wallet/operations'
import { confirmPoolInternal } from '@/lib/pools/confirm'
import { logAuditEvent } from '@/lib/audit/logger'
import { MODULE_DIVERSITY_CAP, POOL_MAX_CANDIDATES, POOL_MIN_CANDIDATES } from './types'

type TxClient = Prisma.TransactionClient

/**
 * Finds or creates the AUTO pool for a given exam event.
 * There is one auto pool per event (until redistributed).
 */
export async function getOrCreateAutoPool(eventId: string, tx: TxClient) {
  // Look for an existing open auto pool
  const existing = await tx.examPool.findFirst({
    where: {
      eventId,
      poolType: 'AUTO',
      isAutoPool: true,
      status: { in: ['DRAFT', 'OPEN'] },
    },
  })

  if (existing) return existing

  // Get event dates to set placeholder exam times
  const event = await tx.examEvent.findUniqueOrThrow({
    where: { id: eventId },
    select: { startDate: true },
  })

  return tx.examPool.create({
    data: {
      eventId,
      name: 'Auto Pool - Pending Assignment',
      examDate: event.startDate,
      examStartTime: event.startDate,
      examEndTime: event.startDate,
      minCandidates: 0,
      maxCandidates: 9999, // no cap on auto pool — it redistributes
      moduleDiversityCap: 99,
      status: 'OPEN',
      poolType: 'AUTO',
      dayNumber: 0,
      timeSlot: null,
      poolLabel: 'AUTO',
      isAutoPool: true,
      seatPrice: 0, // pricing handled at booking level
    },
  })
}

/**
 * Adds a student to the auto pool for an event.
 * Creates a PoolMembership and ExamBooking, reserves wallet funds.
 */
export async function addToAutoPool(params: {
  userId: string
  eventId: string
  bookingType: BookingType
  examComponentId: string
  moduleCode: string
  amount: number
  isResit?: boolean
  tx: TxClient
}) {
  const { userId, eventId, bookingType, examComponentId, moduleCode, amount, isResit, tx } = params

  const autoPool = await getOrCreateAutoPool(eventId, tx)
  const bookingStatus = amount > 0 ? 'PENDING' : 'APPROVED'

  // Reserve wallet funds if amount > 0
  if (amount > 0) {
    await reserveFunds(
      tx,
      userId,
      amount,
      `Exam booking reserved: ${moduleCode} (${bookingType})`,
      autoPool.id,
      'AUTO_POOL_RESERVE'
    )
  }

  // Create the ExamBooking record
  const booking = await tx.examBooking.create({
    data: {
      userId,
      eventId,
      examComponentId,
      moduleCode,
      bookingType,
      amountPaid: amount,
      status: bookingStatus,
      isResit: isResit ?? false,
      autoPoolId: autoPool.id,
    },
  })

  // Create pool membership linked to booking
  const membership = await tx.poolMembership.create({
    data: {
      poolId: autoPool.id,
      userId,
      examComponentId,
      bookingId: booking.id,
      status: 'RESERVED',
      amountReserved: amount,
    },
  })

  // Increment auto pool count
  await tx.examPool.update({
    where: { id: autoPool.id },
    data: { currentMemberCount: { increment: 1 } },
  })

  return { booking, membership, autoPool }
}

/**
 * Redistributes students from the auto pool into standard pools.
 * Called at booking deadline or manually by admin.
 *
 * Algorithm:
 * 1. Find auto pool(s) for the event
 * 2. Lock them as REDISTRIBUTING
 * 3. Get standard pools sorted by count desc (fill nearly-full first to hit 25 confirmation)
 * 4. Move each membership to a standard pool with capacity
 * 5. If all pools full, convert auto pool to a substantive standard pool
 * 6. Auto-confirm pools at ≥25 members
 */
export async function redistributeAutoPool(eventId: string) {
  return prisma.$transaction(
    async (tx) => {
      // 1. Find auto pools with members
      const autoPools = await tx.examPool.findMany({
        where: {
          eventId,
          poolType: 'AUTO',
          isAutoPool: true,
          status: { in: ['OPEN', 'DRAFT'] },
        },
        include: {
          memberships: {
            where: { status: 'RESERVED' },
            include: {
              examComponent: { select: { id: true, course: { select: { code: true } } } },
              user: { select: { id: true, profile: { select: { firstName: true, lastName: true } } } },
            },
          },
        },
      })

      if (autoPools.length === 0) return { redistributed: 0, converted: 0 }

      // 2. Lock auto pools
      for (const pool of autoPools) {
        await tx.examPool.update({
          where: { id: pool.id },
          data: { status: 'REDISTRIBUTING' },
        })
      }

      // 3. Get standard pools sorted by member count desc (fill nearly-full first)
      const standardPools = await tx.examPool.findMany({
        where: {
          eventId,
          poolType: 'STANDARD',
          status: { in: ['OPEN', 'NEAR_FULL', 'CONFIRMED'] },
        },
        include: {
          memberships: {
            where: { status: { in: ['RESERVED', 'CONFIRMED'] } },
            select: {
              examComponentId: true,
              examComponent: { select: { course: { select: { code: true } } } },
            },
          },
        },
        orderBy: { currentMemberCount: 'desc' },
      })

      let redistributed = 0
      let converted = 0
      const notifications: { userId: string; poolName: string; moduleCode: string }[] = []

      // 4. For each auto-pool membership, try to place in a standard pool
      for (const autoPool of autoPools) {
        const remainingMembers: typeof autoPool.memberships = []

        for (const membership of autoPool.memberships) {
          let placed = false

          for (const stdPool of standardPools) {
            // Check capacity
            if (stdPool.currentMemberCount >= POOL_MAX_CANDIDATES) continue

            // Check module diversity cap
            const moduleCodesInPool = new Set(
              stdPool.memberships
                .map((m) => m.examComponent?.course?.code)
                .filter(Boolean)
            )
            const memberModuleCode = membership.examComponent?.course?.code
            if (
              memberModuleCode &&
              !moduleCodesInPool.has(memberModuleCode) &&
              moduleCodesInPool.size >= MODULE_DIVERSITY_CAP
            ) {
              continue // would exceed diversity cap
            }

            // Place the student in this standard pool
            await tx.poolMembership.update({
              where: { id: membership.id },
              data: {
                poolId: stdPool.id,
                sourceAutoPoolId: autoPool.id,
              },
            })

            // Update counts
            await tx.examPool.update({
              where: { id: stdPool.id },
              data: { currentMemberCount: { increment: 1 } },
            })
            stdPool.currentMemberCount++ // update in-memory too

            // Add to stdPool's memberships for future diversity checks
            stdPool.memberships.push({
              examComponentId: membership.examComponentId,
              examComponent: membership.examComponent,
            })

            redistributed++
            placed = true

            notifications.push({
              userId: membership.userId,
              poolName: stdPool.name,
              moduleCode: memberModuleCode || 'Exam',
            })

            break
          }

          if (!placed) {
            remainingMembers.push(membership)
          }
        }

        // 5. Handle remaining members — convert auto pool to substantive
        if (remainingMembers.length > 0) {
          // Find next available label
          const existingLabels = standardPools.map((p) => p.poolLabel).filter(Boolean)
          const nextLabel = getNextPoolLabel(existingLabels as string[])

          // Get a day/time from the first available standard pool, or default to Day 1 Morning
          const event = await tx.examEvent.findUniqueOrThrow({
            where: { id: eventId },
            select: { startDate: true },
          })

          await tx.examPool.update({
            where: { id: autoPool.id },
            data: {
              name: `Pool ${nextLabel} - Overflow`,
              poolType: 'STANDARD',
              isAutoPool: false,
              poolLabel: nextLabel,
              status: 'OPEN',
              maxCandidates: POOL_MAX_CANDIDATES,
              minCandidates: POOL_MIN_CANDIDATES,
              moduleDiversityCap: MODULE_DIVERSITY_CAP,
              currentMemberCount: remainingMembers.length,
              seatPrice: 300.0,
              redistributedAt: new Date(),
            },
          })
          converted++

          for (const m of remainingMembers) {
            notifications.push({
              userId: m.userId,
              poolName: `Pool ${nextLabel} - Overflow`,
              moduleCode: m.examComponent?.course?.code || 'Exam',
            })
          }
        } else {
          // Auto pool is empty, mark completed
          await tx.examPool.update({
            where: { id: autoPool.id },
            data: {
              status: 'COMPLETED',
              currentMemberCount: 0,
              redistributedAt: new Date(),
            },
          })
        }

        // Decrement auto pool count for redistributed members
        if (redistributed > 0) {
          await tx.examPool.update({
            where: { id: autoPool.id },
            data: { currentMemberCount: { decrement: redistributed } },
          })
        }
      }

      // 6. Auto-confirm standard pools that hit ≥25
      const poolsToConfirm = await tx.examPool.findMany({
        where: {
          eventId,
          poolType: 'STANDARD',
          status: { in: ['OPEN', 'NEAR_FULL'] },
          currentMemberCount: { gte: POOL_MIN_CANDIDATES },
        },
      })

      for (const pool of poolsToConfirm) {
        await confirmPoolInternal(pool.id, tx)
      }

      // 7. Create notifications for redistributed students
      for (const notif of notifications) {
        await tx.notification.create({
          data: {
            userId: notif.userId,
            title: 'Exam Pool Assignment',
            message: `You have been assigned to "${notif.poolName}" for your ${notif.moduleCode} exam. Check your bookings for details.`,
            type: 'POOL_UPDATE',
            linkUrl: '/student/exam-bookings',
            linkText: 'View Bookings',
          },
        })
      }

      await logAuditEvent(
        {
          action: 'AUTO_POOL_REDISTRIBUTE',
          entity: 'ExamEvent',
          entityId: eventId,
          description: `Auto-pool redistribution: ${redistributed} students moved, ${converted} overflow pools created.`,
        },
        tx
      )

      return { redistributed, converted, confirmed: poolsToConfirm.length }
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 30000,
    }
  )
}

/**
 * Gets the next available pool label (E, F, G, ... after A-D standard).
 */
function getNextPoolLabel(existingLabels: string[]): string {
  const labels = 'EFGHIJKLMNOPQRSTUVWXYZ'.split('')
  for (const label of labels) {
    if (!existingLabels.includes(label)) return label
  }
  return `X${existingLabels.length + 1}`
}
