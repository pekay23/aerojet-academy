import { Prisma, SittingAssignmentStatus } from '@prisma/client'
import prisma from '@/lib/prisma/client'

/**
 * Phase 8 — Resit Backfill and Spare Capacity Utilization
 *
 * After an event is confirmed and sittings are generated, any sitting with
 * fewer assignments than its capacity has spare seats. This module:
 *
 * 1. Identifies spare capacity per sitting
 * 2. Matches RESIT bookings to same-module spare seats
 * 3. Prevents candidate overlap (same user cannot be in two sittings at once)
 * 4. Supports staff-driven approval before committing assignments
 */

export interface SpareCapacitySitting {
  sittingId: string
  moduleCode: string | null
  dayNumber: number
  sessionType: string
  capacity: number
  assignedCount: number
  spareSeats: number
  startTime: Date
  endTime: Date
}

export interface ResitCandidate {
  bookingId: string
  userId: string
  userName: string | null
  moduleCode: string | null
  bookingType: string
  isResit: boolean
}

export interface ResitBackfillProposal {
  sittingId: string
  bookingId: string
  userId: string
  moduleCode: string | null
  reason: string
}

export interface ResitBackfillResult {
  eventId: string
  spareCapacitySittings: SpareCapacitySitting[]
  eligibleResitCandidates: ResitCandidate[]
  proposals: ResitBackfillProposal[]
  warnings: string[]
}

// ─── Spare Capacity Detection ─────────────────────────────────────────────────

/**
 * Find all sittings in an event with unused seats.
 */
export async function detectSpareCapacity(eventId: string): Promise<SpareCapacitySitting[]> {
  const sittings = await prisma.examSitting.findMany({
    where: {
      eventId,
      status: { notIn: ['CANCELLED'] },
    },
    select: {
      id: true,
      dayNumber: true,
      sessionType: true,
      capacity: true,
      startTime: true,
      endTime: true,
      examComponent: {
        select: { course: { select: { code: true } } },
      },
      assignments: {
        where: { status: { in: ['ASSIGNED', 'CONFIRMED'] } },
        select: { id: true },
      },
    },
  })

  return sittings
    .map((sitting) => ({
      sittingId: sitting.id,
      moduleCode: sitting.examComponent?.course?.code ?? null,
      dayNumber: sitting.dayNumber,
      sessionType: sitting.sessionType,
      capacity: sitting.capacity,
      assignedCount: sitting.assignments.length,
      spareSeats: sitting.capacity - sitting.assignments.length,
      startTime: sitting.startTime,
      endTime: sitting.endTime,
    }))
    .filter((s) => s.spareSeats > 0)
    .sort((a, b) => b.spareSeats - a.spareSeats)
}

// ─── Resit Candidate Detection ────────────────────────────────────────────────

/**
 * Find all bookings in an event that represent resit demand and do not yet have
 * a sitting assignment.
 */
export async function findEligibleResitCandidates(eventId: string): Promise<ResitCandidate[]> {
  const bookings = await prisma.examBooking.findMany({
    where: {
      eventId,
      deletedAt: null,
      isResit: true,
      status: { in: ['PENDING', 'APPROVED', 'PROCESSING'] },
      // Must not already be assigned to a sitting
      sittingAssignments: {
        none: { status: { in: ['ASSIGNED', 'CONFIRMED'] } },
      },
    },
    select: {
      id: true,
      userId: true,
      moduleCode: true,
      bookingType: true,
      isResit: true,
      user: {
        select: {
          profile: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  return bookings.map((b) => ({
    bookingId: b.id,
    userId: b.userId,
    userName: b.user?.profile
      ? `${b.user.profile.firstName} ${b.user.profile.lastName}`
      : null,
    moduleCode: b.moduleCode,
    bookingType: b.bookingType,
    isResit: b.isResit,
  }))
}

// ─── Backfill Proposal Generation ─────────────────────────────────────────────

/**
 * Generate proposals for assigning resit candidates to spare sitting capacity.
 * This is a dry-run — it does NOT write to the database.
 *
 * Matching rules:
 * 1. Same-module capacity first
 * 2. Candidate must not already be assigned to a sitting in the same slot
 * 3. One proposal per booking
 */
export async function generateResitBackfillProposals(
  eventId: string
): Promise<ResitBackfillResult> {
  const [spareCapacitySittings, eligibleResitCandidates] = await Promise.all([
    detectSpareCapacity(eventId),
    findEligibleResitCandidates(eventId),
  ])

  const warnings: string[] = []
  const proposals: ResitBackfillProposal[] = []

  // Track which sittings still have capacity as we assign
  const remainingCapacity = new Map(
    spareCapacitySittings.map((s) => [s.sittingId, s.spareSeats])
  )

  // Track which users are already assigned per slot (to prevent overlap)
  const existingAssignments = await prisma.examSittingAssignment.findMany({
    where: {
      sitting: { eventId, status: { notIn: ['CANCELLED'] } },
      status: { in: ['ASSIGNED', 'CONFIRMED'] },
    },
    select: {
      userId: true,
      sitting: { select: { dayNumber: true, sessionType: true } },
    },
  })

  const userSlotSet = new Set<string>()
  for (const assignment of existingAssignments) {
    userSlotSet.add(
      `${assignment.userId}:${assignment.sitting.dayNumber}:${assignment.sitting.sessionType}`
    )
  }

  // Track proposed assignments to prevent intra-batch conflicts
  const proposedUserSlots = new Set<string>()
  const assignedBookingIds = new Set<string>()

  for (const candidate of eligibleResitCandidates) {
    if (assignedBookingIds.has(candidate.bookingId)) continue

    // Find best sitting: same module + most spare capacity
    const candidateSittings = spareCapacitySittings
      .filter((s) => {
        const remaining = remainingCapacity.get(s.sittingId) ?? 0
        if (remaining <= 0) return false

        // Check candidate not already in this slot
        const slotKey = `${candidate.userId}:${s.dayNumber}:${s.sessionType}`
        if (userSlotSet.has(slotKey) || proposedUserSlots.has(slotKey)) return false

        return true
      })
      .sort((a, b) => {
        // Prefer same-module match
        const aMatch = a.moduleCode === candidate.moduleCode ? 1 : 0
        const bMatch = b.moduleCode === candidate.moduleCode ? 1 : 0
        if (aMatch !== bMatch) return bMatch - aMatch

        // Then prefer most spare capacity
        return (remainingCapacity.get(b.sittingId) ?? 0) - (remainingCapacity.get(a.sittingId) ?? 0)
      })

    const bestSitting = candidateSittings[0]
    if (!bestSitting) {
      warnings.push(
        `No spare capacity available for resit candidate ${candidate.userName ?? candidate.userId} (module: ${candidate.moduleCode ?? 'unknown'})`
      )
      continue
    }

    const isSameModule = bestSitting.moduleCode === candidate.moduleCode
    proposals.push({
      sittingId: bestSitting.sittingId,
      bookingId: candidate.bookingId,
      userId: candidate.userId,
      moduleCode: candidate.moduleCode,
      reason: isSameModule
        ? `Same-module match in Day ${bestSitting.dayNumber} ${bestSitting.sessionType}`
        : `Cross-module fill in Day ${bestSitting.dayNumber} ${bestSitting.sessionType} (sitting module: ${bestSitting.moduleCode ?? 'mixed'})`,
    })

    remainingCapacity.set(bestSitting.sittingId, (remainingCapacity.get(bestSitting.sittingId) ?? 0) - 1)
    proposedUserSlots.add(`${candidate.userId}:${bestSitting.dayNumber}:${bestSitting.sessionType}`)
    assignedBookingIds.add(candidate.bookingId)
  }

  return {
    eventId,
    spareCapacitySittings,
    eligibleResitCandidates,
    proposals,
    warnings,
  }
}

// ─── Backfill Execution ───────────────────────────────────────────────────────

/**
 * Execute approved resit backfill proposals by creating sitting assignments.
 * Only processes proposals whose booking+sitting pair does not already exist.
 *
 * Returns count of assignments created.
 */
export async function executeResitBackfill(
  proposals: ResitBackfillProposal[],
  actorId?: string | null
): Promise<{ assignedCount: number; skippedCount: number }> {
  if (proposals.length === 0) return { assignedCount: 0, skippedCount: 0 }

  return prisma.$transaction(async (tx) => {
    let assignedCount = 0
    let skippedCount = 0

    for (const proposal of proposals) {
      // Check if assignment already exists (idempotency guard)
      const existing = await tx.examSittingAssignment.findFirst({
        where: {
          bookingId: proposal.bookingId,
          sittingId: proposal.sittingId,
          status: { notIn: ['CANCELLED'] },
        },
        select: { id: true },
      })

      if (existing) {
        skippedCount++
        continue
      }

      // Verify sitting still has capacity
      const sitting = await tx.examSitting.findUnique({
        where: { id: proposal.sittingId },
        select: {
          capacity: true,
          assignments: {
            where: { status: { in: ['ASSIGNED', 'CONFIRMED'] } },
            select: { id: true },
          },
        },
      })

      if (!sitting || sitting.assignments.length >= sitting.capacity) {
        skippedCount++
        continue
      }

      await tx.examSittingAssignment.create({
        data: {
          sittingId: proposal.sittingId,
          bookingId: proposal.bookingId,
          userId: proposal.userId,
          status: SittingAssignmentStatus.ASSIGNED,
          assignedAt: new Date(),
          assignedBy: actorId ?? null,
        },
      })

      // Update booking demand status to SCHEDULED
      await tx.examBooking.update({
        where: { id: proposal.bookingId },
        data: { demandStatus: 'SCHEDULED' },
      })

      // Update sitting seat counts
      await tx.examSitting.update({
        where: { id: proposal.sittingId },
        data: {
          reservedSeats: { increment: 1 },
          confirmedSeats: { increment: 1 },
        },
      })

      assignedCount++
    }

    return { assignedCount, skippedCount }
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  })
}
