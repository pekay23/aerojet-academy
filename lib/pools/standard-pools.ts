import prisma from '@/lib/prisma/client'
import { Prisma } from '@prisma/client'

const DEFAULT_MORNING_START_HOUR = 9
const DEFAULT_MORNING_END_HOUR = 12
const DEFAULT_AFTERNOON_START_HOUR = 14
const DEFAULT_AFTERNOON_END_HOUR = 17

interface PoolConfig {
  label: string
  name: string
  dayNumber: number
  timeSlot: 'MORNING' | 'AFTERNOON'
}

const STANDARD_POOL_CONFIGS: PoolConfig[] = [
  { label: 'A', name: 'Pool A - Day 1 Morning', dayNumber: 1, timeSlot: 'MORNING' },
  { label: 'B', name: 'Pool B - Day 1 Afternoon', dayNumber: 1, timeSlot: 'AFTERNOON' },
  { label: 'C', name: 'Pool C - Day 2 Morning', dayNumber: 2, timeSlot: 'MORNING' },
  { label: 'D', name: 'Pool D - Day 2 Afternoon', dayNumber: 2, timeSlot: 'AFTERNOON' },
]

function getTimeForSlot(
  baseDate: Date,
  slot: 'MORNING' | 'AFTERNOON',
  type: 'start' | 'end'
): Date {
  const date = new Date(baseDate)
  if (slot === 'MORNING') {
    date.setHours(type === 'start' ? DEFAULT_MORNING_START_HOUR : DEFAULT_MORNING_END_HOUR, 0, 0, 0)
  } else {
    date.setHours(type === 'start' ? DEFAULT_AFTERNOON_START_HOUR : DEFAULT_AFTERNOON_END_HOUR, 0, 0, 0)
  }
  return date
}

function getDayDate(startDate: Date, dayNumber: number): Date {
  const date = new Date(startDate)
  date.setDate(date.getDate() + (dayNumber - 1))
  return date
}

/**
 * Creates the 4 standard exam pools for an event:
 * Pool A (Day 1 Morning), Pool B (Day 1 Afternoon),
 * Pool C (Day 2 Morning), Pool D (Day 2 Afternoon).
 *
 * Can be called within a transaction or standalone.
 */
export async function createStandardPools(
  eventId: string,
  tx?: Prisma.TransactionClient
) {
  const db = tx || prisma

  const event = await db.examEvent.findUniqueOrThrow({
    where: { id: eventId },
    select: { id: true, startDate: true, endDate: true },
  })

  // Check if standard pools already exist for this event
  const existingStandard = await db.examPool.findMany({
    where: { eventId, poolType: 'STANDARD', poolLabel: { in: ['A', 'B', 'C', 'D'] } },
    select: { poolLabel: true },
  })
  const existingLabels = new Set(existingStandard.map((p) => p.poolLabel))

  const poolsToCreate = STANDARD_POOL_CONFIGS.filter(
    (config) => !existingLabels.has(config.label)
  )

  if (poolsToCreate.length === 0) return []

  const created = await Promise.all(
    poolsToCreate.map((config) => {
      const dayDate = getDayDate(event.startDate, config.dayNumber)
      return db.examPool.create({
        data: {
          eventId,
          name: config.name,
          examDate: dayDate,
          examStartTime: getTimeForSlot(dayDate, config.timeSlot, 'start'),
          examEndTime: getTimeForSlot(dayDate, config.timeSlot, 'end'),
          minCandidates: 25,
          maxCandidates: 28,
          moduleDiversityCap: 4,
          status: 'OPEN',
          poolType: 'STANDARD',
          dayNumber: config.dayNumber,
          timeSlot: config.timeSlot,
          poolLabel: config.label,
          isAutoPool: false,
          seatPrice: 300.0,
        },
      })
    })
  )

  return created
}

/**
 * Creates an additional custom pool beyond the standard 4.
 * Admin sets the label, day, and time slot.
 */
export async function createAdditionalPool(
  eventId: string,
  params: {
    name: string
    dayNumber: number
    timeSlot: 'MORNING' | 'AFTERNOON'
    poolLabel: string
    seatPrice?: number
  },
  tx?: Prisma.TransactionClient
) {
  const db = tx || prisma

  const event = await db.examEvent.findUniqueOrThrow({
    where: { id: eventId },
    select: { startDate: true },
  })

  const dayDate = getDayDate(event.startDate, params.dayNumber)

  return db.examPool.create({
    data: {
      eventId,
      name: params.name,
      examDate: dayDate,
      examStartTime: getTimeForSlot(dayDate, params.timeSlot, 'start'),
      examEndTime: getTimeForSlot(dayDate, params.timeSlot, 'end'),
      minCandidates: 25,
      maxCandidates: 28,
      moduleDiversityCap: 4,
      status: 'OPEN',
      poolType: 'STANDARD',
      dayNumber: params.dayNumber,
      timeSlot: params.timeSlot,
      poolLabel: params.poolLabel,
      isAutoPool: false,
      seatPrice: params.seatPrice ?? 300.0,
    },
  })
}
