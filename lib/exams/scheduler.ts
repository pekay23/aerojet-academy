import { Prisma, SessionType, SittingAssignmentStatus, SittingStatus } from '@prisma/client'
import prisma from '@/lib/prisma/client'
import type { EventDemandSnapshot } from '@/lib/exams/demand'
import { getHolidayDates, isHolidayDate } from '@/lib/calendar/holidays'

const DEFAULT_SITTING_CAPACITY = 28
const DEFAULT_MAX_DAILY_EXAMS = 2
const DEFAULT_DURATION_MINUTES = 120

const ACTIVE_BOOKING_STATUSES = ['PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'NO_SHOW'] as const
const ACTIVE_DEMAND_STATUSES = ['DEMAND_CAPTURED', 'POOLED', 'SCHEDULED', 'POSTPONED'] as const
const ACTIVE_ASSIGNMENT_STATUSES = ['ASSIGNED', 'CONFIRMED', 'ATTENDED', 'ABSENT', 'EXCUSED'] as const
const FINAL_ASSIGNMENT_STATUSES = ['ATTENDED', 'ABSENT', 'EXCUSED'] as const

type ScheduleCandidate = {
  bookingId: string
  userId: string
  examComponentId: string
  moduleCode: string
  bookedAt: Date
  guaranteedSeat: boolean
  preferredSessionType: SessionType | null
}

type SlotKey = {
  dayNumber: number
  sessionType: SessionType
}

type SittingPlan = SlotKey & {
  examComponentId: string
  moduleCode: string
  bookingIds: string[]
}

function getInclusiveDayCount(start: Date, end: Date) {
  const normalizedStart = new Date(start)
  normalizedStart.setHours(0, 0, 0, 0)
  const normalizedEnd = new Date(end)
  normalizedEnd.setHours(0, 0, 0, 0)
  return Math.max(1, Math.floor((normalizedEnd.getTime() - normalizedStart.getTime()) / 86400000) + 1)
}

function getEventDayDate(startDate: Date, dayNumber: number) {
  const next = new Date(startDate)
  next.setDate(next.getDate() + (dayNumber - 1))
  return next
}

/**
 * Returns the start/end window for a session slot.
 * Uses ExamComponent.duration (minutes) when provided; falls back to a 3-hour block.
 */
function getSessionWindow(baseDate: Date, sessionType: SessionType, durationMinutes = DEFAULT_DURATION_MINUTES) {
  const start = new Date(baseDate)

  if (sessionType === 'MORNING') {
    start.setHours(9, 0, 0, 0)
  } else if (sessionType === 'AFTERNOON') {
    start.setHours(14, 0, 0, 0)
  } else {
    start.setHours(18, 0, 0, 0)
  }

  const end = new Date(start.getTime() + durationMinutes * 60_000)
  return { start, end }
}

/**
 * Picks the best available examiner for a time window.
 * Respects examiner.maxParallelSittings — supports future multi-examiner events.
 */
async function getExaminerForSlot(
  tx: Prisma.TransactionClient,
  slotStart: Date,
  slotEnd: Date,
): Promise<string | null> {
  const examiners = await tx.examiner.findMany({
    where: { isActive: true },
    select: { id: true, maxParallelSittings: true },
    orderBy: { createdAt: 'asc' },
  })
  if (examiners.length === 0) return null

  for (const examiner of examiners) {
    const overlapping = await tx.examSitting.count({
      where: {
        examinerId: examiner.id,
        status: { notIn: ['CANCELLED'] },
        startTime: { lt: slotEnd },
        endTime: { gt: slotStart },
      },
    })
    if (overlapping < examiner.maxParallelSittings) return examiner.id
  }
  return null
}

function slotToken(slot: SlotKey) {
  return `${slot.dayNumber}:${slot.sessionType}`
}

function buildSlotQueue(requiredCount: number, initialDayCount: number, excludedDays?: Set<number>): SlotKey[] {
  const slots: SlotKey[] = []
  const totalDays = Math.max(initialDayCount, Math.ceil(requiredCount / 2))

  for (let dayNumber = 1; dayNumber <= totalDays; dayNumber += 1) {
    if (excludedDays?.has(dayNumber)) continue // Skip holidays
    slots.push({ dayNumber, sessionType: 'MORNING' })
    slots.push({ dayNumber, sessionType: 'AFTERNOON' })
  }

  return slots
}

function choosePreferredSession(candidates: ScheduleCandidate[]) {
  let morning = 0
  let afternoon = 0

  for (const candidate of candidates) {
    if (candidate.preferredSessionType === 'MORNING') morning += 1
    if (candidate.preferredSessionType === 'AFTERNOON') afternoon += 1
  }

  if (morning > afternoon) return 'MORNING' as const
  if (afternoon > morning) return 'AFTERNOON' as const
  return null
}

function sortCandidates(candidates: ScheduleCandidate[]) {
  return [...candidates].sort((a, b) => {
    if (a.guaranteedSeat !== b.guaranteedSeat) return a.guaranteedSeat ? -1 : 1
    if (a.preferredSessionType !== b.preferredSessionType) {
      if (a.preferredSessionType === 'MORNING') return -1
      if (b.preferredSessionType === 'MORNING') return 1
    }
    return a.bookedAt.getTime() - b.bookedAt.getTime()
  })
}

function canUseSlot(
  slot: SlotKey,
  bookings: ScheduleCandidate[],
  occupiedSlots: Set<string>,
  userSlots: Map<string, Set<string>>,
  userDailyCounts: Map<string, Map<number, number>>
) {
  if (occupiedSlots.has(slotToken(slot))) return false

  for (const booking of bookings) {
    if (userSlots.get(booking.userId)?.has(slotToken(slot))) return false
    if ((userDailyCounts.get(booking.userId)?.get(slot.dayNumber) ?? 0) >= DEFAULT_MAX_DAILY_EXAMS) {
      return false
    }
  }

  return true
}

function reserveSlot(
  slot: SlotKey,
  bookings: ScheduleCandidate[],
  occupiedSlots: Set<string>,
  userSlots: Map<string, Set<string>>,
  userDailyCounts: Map<string, Map<number, number>>
) {
  occupiedSlots.add(slotToken(slot))

  for (const booking of bookings) {
    const slots = userSlots.get(booking.userId) ?? new Set<string>()
    slots.add(slotToken(slot))
    userSlots.set(booking.userId, slots)

    const dailyCounts = userDailyCounts.get(booking.userId) ?? new Map<number, number>()
    dailyCounts.set(slot.dayNumber, (dailyCounts.get(slot.dayNumber) ?? 0) + 1)
    userDailyCounts.set(booking.userId, dailyCounts)
  }
}

function buildSittingPlans(
  groupedCandidates: Array<{ examComponentId: string; moduleCode: string; bookings: ScheduleCandidate[] }>,
  initialDayCount: number,
  existingSlots: Set<string>,
  existingUserSlots: Map<string, Set<string>>,
  existingUserDailyCounts: Map<string, Map<number, number>>,
  excludedDays?: Set<number>
) {
  const requiredCount = groupedCandidates.reduce(
    (sum, group) => sum + Math.max(1, Math.ceil(group.bookings.length / DEFAULT_SITTING_CAPACITY)),
    0
  )

  const slots = buildSlotQueue(requiredCount + existingSlots.size, initialDayCount, excludedDays)
  const occupiedSlots = new Set(existingSlots)
  const userSlots = new Map(existingUserSlots)
  const userDailyCounts = new Map(existingUserDailyCounts)
  const plans: SittingPlan[] = []

  for (const group of groupedCandidates) {
    const sorted = sortCandidates(group.bookings)
    for (let index = 0; index < sorted.length; index += DEFAULT_SITTING_CAPACITY) {
      const chunk = sorted.slice(index, index + DEFAULT_SITTING_CAPACITY)
      const preferredSession = choosePreferredSession(chunk)

      let chosenSlot =
        slots.find(
          (slot) =>
            slot.sessionType === preferredSession &&
            canUseSlot(slot, chunk, occupiedSlots, userSlots, userDailyCounts)
        ) ?? null

      if (!chosenSlot) {
        chosenSlot =
          slots.find((slot) => canUseSlot(slot, chunk, occupiedSlots, userSlots, userDailyCounts)) ??
          null
      }

      if (!chosenSlot) {
        const dayNumber = Math.floor(slots.length / 2) + 1
        chosenSlot = {
          dayNumber,
          sessionType: slots.length % 2 === 0 ? 'MORNING' : 'AFTERNOON',
        }
        slots.push(chosenSlot)
      }

      reserveSlot(chosenSlot, chunk, occupiedSlots, userSlots, userDailyCounts)
      plans.push({
        examComponentId: group.examComponentId,
        moduleCode: group.moduleCode,
        dayNumber: chosenSlot.dayNumber,
        sessionType: chosenSlot.sessionType,
        bookingIds: chunk.map((booking) => booking.bookingId),
      })
    }
  }

  return plans
}

export async function scheduleEventSittings(
  eventId: string,
  options?: {
    preserveExistingAssignments?: boolean
    actorId?: string | null
  }
) {
  const preserveExistingAssignments = options?.preserveExistingAssignments ?? true

  return prisma.$transaction(async (tx) => {
    const event = await tx.examEvent.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        location: true,
        status: true,
        examBookings: {
          where: {
            deletedAt: null,
            status: { in: [...ACTIVE_BOOKING_STATUSES] },
            demandStatus: { in: [...ACTIVE_DEMAND_STATUSES] },
          },
          select: {
            id: true,
            userId: true,
            examComponentId: true,
            moduleCode: true,
            bookedAt: true,
            guaranteedSeat: true,
            preferredSessionType: true,
            status: true,
            examAttendance: { select: { id: true } },
            sittingAssignments: {
              where: { status: { in: [...ACTIVE_ASSIGNMENT_STATUSES] } },
              select: {
                id: true,
                status: true,
                sittingId: true,
                sitting: {
                  select: {
                    id: true,
                    dayNumber: true,
                    sessionType: true,
                    examComponentId: true,
                  },
                },
              },
              orderBy: { assignedAt: 'desc' },
            },
            examComponent: {
              select: {
                id: true,
                course: { select: { code: true } },
              },
            },
          },
          orderBy: [{ guaranteedSeat: 'desc' }, { bookedAt: 'asc' }],
        },
      },
    })

    if (!event) throw new Error('Exam event not found')

    const existingSlots = new Set<string>()
    const existingUserSlots = new Map<string, Set<string>>()
    const existingUserDailyCounts = new Map<string, Map<number, number>>()
    const groupedCandidates = new Map<
      string,
      { examComponentId: string; moduleCode: string; bookings: ScheduleCandidate[] }
    >()

    for (const booking of event.examBookings) {
      const moduleCode = booking.moduleCode?.trim() || booking.examComponent?.course?.code?.trim() || null
      if (!booking.examComponentId || !moduleCode) continue

      const activeAssignment = booking.sittingAssignments[0]
      if (preserveExistingAssignments && activeAssignment) {
        reserveSlot(
          {
            dayNumber: activeAssignment.sitting.dayNumber,
            sessionType: activeAssignment.sitting.sessionType,
          },
          [
            {
              bookingId: booking.id,
              userId: booking.userId,
              examComponentId: booking.examComponentId,
              moduleCode,
              bookedAt: booking.bookedAt,
              guaranteedSeat: booking.guaranteedSeat,
              preferredSessionType: booking.preferredSessionType,
            },
          ],
          existingSlots,
          existingUserSlots,
          existingUserDailyCounts
        )
        continue
      }

      const key = `${booking.examComponentId}:${moduleCode}`
      const group = groupedCandidates.get(key) ?? {
        examComponentId: booking.examComponentId,
        moduleCode,
        bookings: [],
      }

      group.bookings.push({
        bookingId: booking.id,
        userId: booking.userId,
        examComponentId: booking.examComponentId,
        moduleCode,
        bookedAt: booking.bookedAt,
        guaranteedSeat: booking.guaranteedSeat,
        preferredSessionType: booking.preferredSessionType,
      })
      groupedCandidates.set(key, group)
    }

    const groupedList = Array.from(groupedCandidates.values()).sort((a, b) => {
      const guaranteedDiff =
        b.bookings.filter((booking) => booking.guaranteedSeat).length -
        a.bookings.filter((booking) => booking.guaranteedSeat).length
      if (guaranteedDiff !== 0) return guaranteedDiff
      return b.bookings.length - a.bookings.length
    })

    // Fetch holidays within the event date range and convert to excluded day numbers
    const holidayDates = await getHolidayDates(event.startDate, event.endDate)
    const excludedDays = new Set<number>()
    const totalDays = getInclusiveDayCount(event.startDate, event.endDate)
    for (let d = 1; d <= totalDays; d++) {
      const dayDate = getEventDayDate(event.startDate, d)
      if (isHolidayDate(dayDate, holidayDates)) {
        excludedDays.add(d)
      }
    }

    const plans = buildSittingPlans(
      groupedList,
      totalDays,
      existingSlots,
      existingUserSlots,
      existingUserDailyCounts,
      excludedDays
    )

    const existingSittings = await tx.examSitting.findMany({
      where: { eventId },
      select: {
        id: true,
        examinerId: true,
        examComponentId: true,
        dayNumber: true,
        sessionType: true,
      },
    })

    for (const plan of plans) {
      // Look up component duration for accurate session window
      const componentDuration = await tx.examComponent
        .findUnique({ where: { id: plan.examComponentId }, select: { duration: true } })
        .then((c) => c?.duration ?? DEFAULT_DURATION_MINUTES)

      const sessionDate = getEventDayDate(event.startDate, plan.dayNumber)
      const window = getSessionWindow(sessionDate, plan.sessionType, componentDuration)

      // Pick the least-loaded available examiner for this specific window
      const examinerId = await getExaminerForSlot(tx, window.start, window.end)

      const matchedSitting = existingSittings.find(
        (sitting) =>
          sitting.examComponentId === plan.examComponentId &&
          sitting.dayNumber === plan.dayNumber &&
          sitting.sessionType === plan.sessionType
      )

      const confirmedSeats = await tx.examBooking.count({
        where: {
          id: { in: plan.bookingIds },
          status: { in: ['APPROVED', 'PROCESSING', 'COMPLETED', 'NO_SHOW'] },
        },
      })

      const sitting =
        matchedSitting
          ? await tx.examSitting.update({
              where: { id: matchedSitting.id },
              data: {
                startTime: window.start,
                endTime: window.end,
                venue: event.location,
                reservedSeats: plan.bookingIds.length,
                confirmedSeats,
                examinerId: examinerId ?? matchedSitting.examinerId,
                status: event.status === 'CONFIRMED' ? SittingStatus.CONFIRMED : SittingStatus.SCHEDULED,
              },
            })
          : await tx.examSitting.create({
              data: {
                eventId,
                examinerId,
                examComponentId: plan.examComponentId,
                dayNumber: plan.dayNumber,
                sessionType: plan.sessionType,
                startTime: window.start,
                endTime: window.end,
                capacity: DEFAULT_SITTING_CAPACITY,
                reservedSeats: plan.bookingIds.length,
                confirmedSeats,
                status: event.status === 'CONFIRMED' ? SittingStatus.CONFIRMED : SittingStatus.SCHEDULED,
                venue: event.location,
                notes: 'Generated by sitting scheduler',
              },
            })

      for (const bookingId of plan.bookingIds) {
        const booking = event.examBookings.find((item) => item.id === bookingId)
        if (!booking) continue

        await tx.examSittingAssignment.upsert({
          where: {
            bookingId_sittingId: {
              bookingId,
              sittingId: sitting.id,
            },
          },
          update: {
            userId: booking.userId,
            status:
              booking.status === 'APPROVED' || booking.status === 'COMPLETED'
                ? SittingAssignmentStatus.CONFIRMED
                : SittingAssignmentStatus.ASSIGNED,
            assignedBy: options?.actorId ?? null,
          },
          create: {
            sittingId: sitting.id,
            bookingId,
            userId: booking.userId,
            status:
              booking.status === 'APPROVED' || booking.status === 'COMPLETED'
                ? SittingAssignmentStatus.CONFIRMED
                : SittingAssignmentStatus.ASSIGNED,
            assignedBy: options?.actorId ?? null,
          },
        })

        await tx.examSittingAssignment.updateMany({
          where: {
            bookingId,
            sittingId: { not: sitting.id },
            status: { in: ['ASSIGNED', 'CONFIRMED'] },
          },
          data: { status: 'CANCELLED', attendanceStatus: null },
        })

        await tx.examBooking.update({
          where: { id: bookingId },
          data: {
            demandStatus: 'SCHEDULED',
            examDate: window.start,
          },
        })

        if (booking.examAttendance?.id) {
          await tx.examAttendance.update({
            where: { bookingId },
            data: {
              sittingId: sitting.id,
              attendanceDate: window.start,
              eventId,
              examComponentId: plan.examComponentId,
            },
          })
        }
      }
    }

    const refreshedSittings = await tx.examSitting.findMany({
      where: { eventId },
      select: {
        id: true,
        assignments: {
          where: { status: { in: ['ASSIGNED', 'CONFIRMED', 'ATTENDED', 'ABSENT', 'EXCUSED'] } },
          select: { status: true },
        },
      },
    })

    for (const sitting of refreshedSittings) {
      await tx.examSitting.update({
        where: { id: sitting.id },
        data: {
          reservedSeats: sitting.assignments.length,
          confirmedSeats: sitting.assignments.filter((assignment) =>
            ['CONFIRMED', 'ATTENDED', 'ABSENT', 'EXCUSED'].includes(assignment.status)
          ).length,
        },
      })
    }

    return {
      eventId: event.id,
      eventName: event.name,
      generatedSittings: plans.length,
      preservedAssignments: existingSlots.size,
    }
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  })
}

/**
 * Phase 5 — demand-snapshot entry point.
 *
 * Accepts a pre-fetched EventDemandSnapshot (from lib/exams/demand.ts) to allow
 * callers to detect demand gaps before scheduling. The demand snapshot is used to
 * surface unscheduled guaranteed modules in the result; the actual sitting creation
 * still runs through scheduleEventSittings so all slot/examiner logic is shared.
 */
export async function scheduleEventSittingsFromDemand(
  eventId: string,
  demandSnapshot: EventDemandSnapshot,
  options?: { preserveExistingAssignments?: boolean; actorId?: string | null }
) {
  const result = await scheduleEventSittings(eventId, options)

  // Surface which guaranteed modules had demand but may still be unscheduled
  const guaranteedModules = demandSnapshot.modules.filter((m) => m.guaranteedCount > 0)
  const scheduledModuleCodes = new Set(
    await prisma.examSitting.findMany({
      where: { eventId },
      select: { examComponent: { select: { course: { select: { code: true } } } } },
    }).then((sittings) =>
      sittings
        .map((s) => s.examComponent?.course?.code)
        .filter((c): c is string => Boolean(c))
    )
  )

  const unscheduledGuaranteedModules = guaranteedModules
    .filter((m) => !scheduledModuleCodes.has(m.moduleCode))
    .map((m) => m.moduleCode)

  return { ...result, unscheduledGuaranteedModules }
}

// ─── Conflict Detection (Phase 5 warning panel) ───────────────────────────────

export type SchedulingConflictType =
  | 'CANDIDATE_OVERLAP'
  | 'EXAMINER_OVERLAP'
  | 'VENUE_OVERLAP'
  | 'SPARE_CAPACITY'
  | 'UNSCHEDULED_GUARANTEED'

export interface SchedulingConflict {
  type: SchedulingConflictType
  sittingId?: string
  userId?: string
  examinerId?: string
  venue?: string
  moduleCode?: string
  description: string
}

function timesOverlap(a: { startTime: Date | null; endTime: Date | null }, b: { startTime: Date | null; endTime: Date | null }): boolean {
  if (!a.startTime || !a.endTime || !b.startTime || !b.endTime) return false
  return a.startTime < b.endTime && b.startTime < a.endTime
}

/**
 * Phase 5 — detect scheduling problems for the staff warning panel.
 * Checks:
 *  - same candidate assigned to two overlapping sittings
 *  - same examiner assigned to two overlapping sittings
 *  - sittings with spare capacity
 *  - guaranteed bookings with no sitting assignment yet
 */
export async function detectSchedulingConflicts(eventId: string): Promise<SchedulingConflict[]> {
  const conflicts: SchedulingConflict[] = []

  const sittings = await prisma.examSitting.findMany({
    where: { eventId, status: { notIn: ['CANCELLED'] } },
    select: {
      id: true,
      examinerId: true,
      examiner: { select: { maxParallelSittings: true } },
      dayNumber: true,
      sessionType: true,
      startTime: true,
      endTime: true,
      capacity: true,
      venue: true,
      examComponent: { select: { course: { select: { code: true } } } },
      assignments: {
        where: { status: { in: ['ASSIGNED', 'CONFIRMED'] } },
        select: { userId: true },
      },
    },
  })

  // ── Candidate overlap (time-based) ──
  type SlotInfo = { dayNumber: number; startTime: Date | null; endTime: Date | null; sessionType: string; sittingId: string }
  const userSlotMap = new Map<string, SlotInfo[]>()
  for (const sitting of sittings) {
    for (const assignment of sitting.assignments) {
      const prior = userSlotMap.get(assignment.userId) ?? []
      const overlap = prior.find(
        (s) => s.dayNumber === sitting.dayNumber && (timesOverlap(s, sitting) || s.sessionType === sitting.sessionType)
      )
      if (overlap) {
        conflicts.push({
          type: 'CANDIDATE_OVERLAP',
          sittingId: sitting.id,
          userId: assignment.userId,
          description: `Candidate double-booked on Day ${sitting.dayNumber} ${sitting.sessionType}`,
        })
      }
      prior.push({ dayNumber: sitting.dayNumber, startTime: sitting.startTime, endTime: sitting.endTime, sessionType: sitting.sessionType, sittingId: sitting.id })
      userSlotMap.set(assignment.userId, prior)
    }
  }

  // ── Examiner overlap (respects maxParallelSittings) ──
  const examinerSlotMap = new Map<string, SlotInfo[]>()
  for (const sitting of sittings) {
    if (!sitting.examinerId) continue
    const maxParallel = sitting.examiner?.maxParallelSittings ?? 1
    const prior = examinerSlotMap.get(sitting.examinerId) ?? []
    const overlapping = prior.filter(
      (s) => s.dayNumber === sitting.dayNumber && (timesOverlap(s, sitting) || s.sessionType === sitting.sessionType)
    )
    if (overlapping.length >= maxParallel) {
      conflicts.push({
        type: 'EXAMINER_OVERLAP',
        sittingId: sitting.id,
        examinerId: sitting.examinerId,
        description: `Examiner exceeds ${maxParallel} parallel sitting(s) on Day ${sitting.dayNumber} ${sitting.sessionType}`,
      })
    }
    prior.push({ dayNumber: sitting.dayNumber, startTime: sitting.startTime, endTime: sitting.endTime, sessionType: sitting.sessionType, sittingId: sitting.id })
    examinerSlotMap.set(sitting.examinerId, prior)
  }

  // ── Venue overlap (same room, overlapping times) ──
  const venueSlotMap = new Map<string, Array<SlotInfo & { moduleCode?: string }>>()
  for (const sitting of sittings) {
    if (!sitting.venue) continue
    const venueKey = sitting.venue.trim().toLowerCase()
    const prior = venueSlotMap.get(venueKey) ?? []
    const overlap = prior.find(
      (s) => s.dayNumber === sitting.dayNumber && timesOverlap(s, sitting)
    )
    if (overlap) {
      conflicts.push({
        type: 'VENUE_OVERLAP',
        sittingId: sitting.id,
        venue: sitting.venue,
        description: `Venue "${sitting.venue}" double-booked on Day ${sitting.dayNumber} (conflicts with sitting ${overlap.sittingId})`,
      })
    }
    prior.push({ dayNumber: sitting.dayNumber, startTime: sitting.startTime, endTime: sitting.endTime, sessionType: sitting.sessionType, sittingId: sitting.id, moduleCode: sitting.examComponent?.course?.code })
    venueSlotMap.set(venueKey, prior)
  }

  // ── Spare capacity ──
  for (const sitting of sittings) {
    const assigned = sitting.assignments.length
    const spare = sitting.capacity - assigned
    if (spare > 0 && assigned > 0) {
      conflicts.push({
        type: 'SPARE_CAPACITY',
        sittingId: sitting.id,
        moduleCode: sitting.examComponent?.course?.code ?? undefined,
        description: `${spare} spare seat(s) available (${assigned}/${sitting.capacity} filled)`,
      })
    }
  }

  // ── Unscheduled guaranteed demand ──
  const unscheduled = await prisma.examBooking.findMany({
    where: {
      eventId,
      deletedAt: null,
      guaranteedSeat: true,
      demandStatus: { in: ['DEMAND_CAPTURED', 'POOLED'] },
      sittingAssignments: { none: { status: { in: ['ASSIGNED', 'CONFIRMED'] } } },
    },
    select: { id: true, moduleCode: true, userId: true },
  })
  for (const booking of unscheduled) {
    conflicts.push({
      type: 'UNSCHEDULED_GUARANTEED',
      userId: booking.userId,
      moduleCode: booking.moduleCode ?? undefined,
      description: `Guaranteed booking for module "${booking.moduleCode ?? 'unknown'}" has no sitting assignment`,
    })
  }

  return conflicts
}
