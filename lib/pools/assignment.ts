import { Prisma } from '@prisma/client'
import { MODULE_DIVERSITY_CAP, POOL_MAX_CANDIDATES } from './types'
import { COUNTABLE_MEMBERSHIP_STATUSES } from '@/lib/utils/constants'

type TxClient = Prisma.TransactionClient

const MORNING_START_HOUR = 9
const MORNING_END_HOUR = 12
const AFTERNOON_START_HOUR = 14
const AFTERNOON_END_HOUR = 17

function getTimeForSlot(baseDate: Date, slot: 'MORNING' | 'AFTERNOON', type: 'start' | 'end') {
  const date = new Date(baseDate)
  if (slot === 'MORNING') {
    date.setHours(type === 'start' ? MORNING_START_HOUR : MORNING_END_HOUR, 0, 0, 0)
  } else {
    date.setHours(type === 'start' ? AFTERNOON_START_HOUR : AFTERNOON_END_HOUR, 0, 0, 0)
  }
  return date
}

function getDayDate(startDate: Date, dayNumber: number) {
  const date = new Date(startDate)
  date.setDate(date.getDate() + (dayNumber - 1))
  return date
}

function getPoolLabel(index: number) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  if (index < alphabet.length) return alphabet[index]
  return `X${index + 1}`
}

function normalizeSlotRank(slot: string | null | undefined) {
  return slot === 'AFTERNOON' ? 1 : 0
}

function comparePools(
  a: { examDate: Date; dayNumber: number | null; timeSlot: string | null; createdAt: Date },
  b: { examDate: Date; dayNumber: number | null; timeSlot: string | null; createdAt: Date }
) {
  const dayDiff =
    (a.dayNumber ?? Number.MAX_SAFE_INTEGER) - (b.dayNumber ?? Number.MAX_SAFE_INTEGER)
  if (dayDiff !== 0) return dayDiff

  const dateDiff = a.examDate.getTime() - b.examDate.getTime()
  if (dateDiff !== 0) return dateDiff

  const slotDiff = normalizeSlotRank(a.timeSlot) - normalizeSlotRank(b.timeSlot)
  if (slotDiff !== 0) return slotDiff

  return a.createdAt.getTime() - b.createdAt.getTime()
}

async function createOverflowPool(
  tx: TxClient,
  eventId: string,
  moduleCode: string
) {
  const event = await tx.examEvent.findUniqueOrThrow({
    where: { id: eventId },
    select: { startDate: true },
  })

  const existingStandardPools = await tx.examPool.findMany({
    where: { eventId, poolType: 'STANDARD' },
    select: {
      id: true,
      poolLabel: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  const nextIndex = existingStandardPools.length
  const poolLabel = getPoolLabel(nextIndex)
  const dayNumber = Math.floor(nextIndex / 2) + 1
  const timeSlot = nextIndex % 2 === 0 ? 'MORNING' : 'AFTERNOON'
  const examDate = getDayDate(event.startDate, dayNumber)

  return tx.examPool.create({
    data: {
      eventId,
      name: `Pool ${nextIndex + 1}: ${examDate.toISOString().split('T')[0]} ${timeSlot === 'MORNING' ? 'Morning' : 'Afternoon'}`,
      examDate,
      examStartTime: getTimeForSlot(examDate, timeSlot, 'start'),
      examEndTime: getTimeForSlot(examDate, timeSlot, 'end'),
      minCandidates: 25,
      maxCandidates: 28,
      moduleDiversityCap: MODULE_DIVERSITY_CAP,
      status: 'OPEN',
      poolType: 'STANDARD',
      dayNumber,
      timeSlot,
      poolLabel,
      isAutoPool: false,
      seatPrice: 300.0,
      allowedModules: [moduleCode],
      preSeedModules: [moduleCode],
    },
  })
}

export async function resolveStandardPoolForJoin(
  tx: TxClient,
  params: {
    eventId: string
    moduleCode: string
    preferredPoolId?: string | null
  }
) {
  const { eventId, moduleCode, preferredPoolId } = params

  const standardPools = await tx.examPool.findMany({
    where: {
      eventId,
      poolType: 'STANDARD',
      isAutoPool: false,
      status: { in: ['OPEN', 'NEAR_FULL', 'DRAFT', 'CONFIRMED'] },
    },
    select: {
      id: true,
      name: true,
      examDate: true,
      currentMemberCount: true,
      maxCandidates: true,
      dayNumber: true,
      timeSlot: true,
      createdAt: true,
      memberships: {
        where: { status: { in: COUNTABLE_MEMBERSHIP_STATUSES } },
        select: {
          examComponent: {
            select: {
              course: {
                select: { code: true },
              },
            },
          },
        },
      },
    },
    orderBy: [{ dayNumber: 'asc' }, { examDate: 'asc' }, { createdAt: 'asc' }],
  })

  const sortedPools = [...standardPools].sort(comparePools)

  const enrichedPools = sortedPools.map((pool) => {
    const modules = Array.from(
      new Set(
        pool.memberships
          .map((membership) => membership.examComponent?.course?.code)
          .filter((code): code is string => Boolean(code))
      )
    )

    return {
      ...pool,
      modules,
      hasCapacity: pool.currentMemberCount < Math.min(pool.maxCandidates, POOL_MAX_CANDIDATES),
      hasModule: modules.includes(moduleCode),
      canAddNewModule: modules.length < MODULE_DIVERSITY_CAP,
    }
  })

  const preferredPool = preferredPoolId
    ? enrichedPools.find((pool) => pool.id === preferredPoolId)
    : null

  if (preferredPool?.hasCapacity && (preferredPool.hasModule || preferredPool.canAddNewModule)) {
    return preferredPool
  }

  const sameModulePool = enrichedPools.find((pool) => pool.hasCapacity && pool.hasModule)
  if (sameModulePool) return sameModulePool

  const openModuleSlotPool = enrichedPools.find((pool) => pool.hasCapacity && pool.canAddNewModule)
  if (openModuleSlotPool) return openModuleSlotPool

  return createOverflowPool(tx, eventId, moduleCode)
}
