import { BookingType, Prisma } from '@prisma/client'
import prisma from '@/lib/prisma/client'

type BookingGuaranteeTypeValue =
  | 'POOL_FLEX'
  | 'INDIVIDUAL_GUARANTEED'
  | 'COMPANY_GUARANTEED'
  | 'BUNDLE_GUARANTEED'

export interface EventDemandModuleSummary {
  moduleCode: string
  bookingCount: number
  guaranteedCount: number
  flexibleCount: number
}

export interface EventDemandPoolSummary {
  poolId: string
  poolName: string
  status: string
  currentMemberCount: number
  maxCandidates: number
  distinctModuleCount: number
  guaranteedSeats: number
  totalDemandSeats: number
  modules: string[]
}

export interface EventDemandSnapshot {
  eventId: string
  eventName: string
  totals: {
    bookingCount: number
    guaranteedCount: number
    flexibleCount: number
    paidSeatCount: number
    candidateCount: number
  }
  byBookingType: Array<{
    bookingType: string
    count: number
    guaranteedCount: number
  }>
  modules: EventDemandModuleSummary[]
  pools: EventDemandPoolSummary[]
}

type DemandEventRecord = {
  id: string
  name: string
  examBookings: Array<{
    userId: string
    bookingType: BookingType
    guaranteeType: BookingGuaranteeTypeValue | null
    moduleCode: string | null
    status: string
    bookingGroupRef: string | null
  }>
  pools: Array<{
    id: string
    name: string
    status: string
    currentMemberCount: number
    maxCandidates: number
    guaranteedSeats: number
    totalDemandSeats: number
    memberships: Array<{
      examComponent: {
        course: {
          code: string
        } | null
      } | null
    }>
  }>
}

function deriveGuaranteeType(
  bookingType: BookingType,
  guaranteeType: BookingGuaranteeTypeValue | null | undefined
): BookingGuaranteeTypeValue {
  if (guaranteeType) return guaranteeType

  switch (bookingType) {
    case 'POOL':
      return 'POOL_FLEX'
    case 'GROUP_CHARTER':
      return 'COMPANY_GUARANTEED'
    case 'TWIN_PACK':
    case 'FOUR_PACK':
      return 'BUNDLE_GUARANTEED'
    default:
      return 'INDIVIDUAL_GUARANTEED'
  }
}

function isGuaranteed(guaranteeType: BookingGuaranteeTypeValue) {
  return guaranteeType !== 'POOL_FLEX'
}

function buildDemandSnapshot(event: DemandEventRecord): EventDemandSnapshot {
  const moduleMap = new Map<string, EventDemandModuleSummary>()
  const byBookingTypeMap = new Map<string, { count: number; guaranteedCount: number }>()
  const processedBundles = new Set<string>()

  let guaranteedCount = 0
  let flexibleCount = 0
  let paidSeatCount = 0
  const uniqueUsers = new Set<string>()

  for (const booking of event.examBookings) {
    const resolvedGuarantee = deriveGuaranteeType(booking.bookingType, booking.guaranteeType)
    const guaranteed = isGuaranteed(resolvedGuarantee)
    const moduleCode = booking.moduleCode?.trim() || 'UNSPECIFIED'

    if (guaranteed) guaranteedCount += 1
    else flexibleCount += 1

    if (['APPROVED', 'COMPLETED', 'PROCESSING', 'NO_SHOW'].includes(booking.status)) {
      paidSeatCount += 1
    }
    
    uniqueUsers.add(booking.userId)

    const moduleSummary = moduleMap.get(moduleCode) ?? {
      moduleCode,
      bookingCount: 0,
      guaranteedCount: 0,
      flexibleCount: 0,
    }
    moduleSummary.bookingCount += 1
    if (guaranteed) moduleSummary.guaranteedCount += 1
    else moduleSummary.flexibleCount += 1
    moduleMap.set(moduleCode, moduleSummary)

    const bundleId = booking.bookingGroupRef || `${booking.userId}_${booking.bookingType}`
    if (!processedBundles.has(bundleId)) {
      const typeSummary = byBookingTypeMap.get(booking.bookingType) ?? {
        count: 0,
        guaranteedCount: 0,
      }
      typeSummary.count += 1
      if (guaranteed) typeSummary.guaranteedCount += 1
      byBookingTypeMap.set(booking.bookingType, typeSummary)
      processedBundles.add(bundleId)
    }
  }

  const pools: EventDemandPoolSummary[] = event.pools.map((pool) => {
    const modules = Array.from(
      new Set(
        pool.memberships
          .map((membership) => membership.examComponent?.course?.code)
          .filter((code): code is string => Boolean(code))
      )
    ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))

    return {
      poolId: pool.id,
      poolName: pool.name,
      status: pool.status,
      currentMemberCount: pool.currentMemberCount,
      maxCandidates: pool.maxCandidates,
      distinctModuleCount: modules.length,
      guaranteedSeats: pool.guaranteedSeats,
      totalDemandSeats: pool.totalDemandSeats,
      modules,
    }
  })

  return {
    eventId: event.id,
    eventName: event.name,
    totals: {
      bookingCount: event.examBookings.length,
      guaranteedCount,
      flexibleCount,
      paidSeatCount,
      candidateCount: uniqueUsers.size,
    },
    byBookingType: Array.from(byBookingTypeMap.entries()).map(([bookingType, summary]) => ({
      bookingType,
      count: summary.count,
      guaranteedCount: summary.guaranteedCount,
    })),
    modules: Array.from(moduleMap.values()).sort((a, b) =>
      a.moduleCode.localeCompare(b.moduleCode, undefined, { numeric: true, sensitivity: 'base' })
    ),
    pools,
  }
}

export async function getEventDemandSnapshot(eventId: string): Promise<EventDemandSnapshot | null> {
  const event = await prisma.examEvent.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      name: true,
      examBookings: {
        where: { deletedAt: null },
        select: {
          id: true,
          userId: true,
          bookingType: true,
          guaranteeType: true,
          moduleCode: true,
          status: true,
          bookingGroupRef: true,
        },
      },
      pools: {
        select: {
          id: true,
          name: true,
          status: true,
          currentMemberCount: true,
          maxCandidates: true,
          guaranteedSeats: true,
          totalDemandSeats: true,
          memberships: {
            where: { status: { in: ['RESERVED', 'CONFIRMED', 'NO_SHOW', 'COMPLETED'] } },
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
      },
    },
  })

  if (!event) return null

  return buildDemandSnapshot(event)
}

export async function getEventDemandSnapshots(eventIds: string[]): Promise<Map<string, EventDemandSnapshot>> {
  if (eventIds.length === 0) return new Map()

  const events = await prisma.examEvent.findMany({
    where: { id: { in: eventIds } },
    select: {
      id: true,
      name: true,
      examBookings: {
        where: { deletedAt: null },
        select: {
          id: true,
          userId: true,
          bookingType: true,
          guaranteeType: true,
          moduleCode: true,
          status: true,
          bookingGroupRef: true,
        },
      },
      pools: {
        select: {
          id: true,
          name: true,
          status: true,
          currentMemberCount: true,
          maxCandidates: true,
          guaranteedSeats: true,
          totalDemandSeats: true,
          memberships: {
            where: { status: { in: ['RESERVED', 'CONFIRMED', 'NO_SHOW', 'COMPLETED'] } },
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
      },
    },
  })

  return new Map(events.map((event) => [event.id, buildDemandSnapshot(event)]))
}

export type EventDemandSnapshotRow = Prisma.PromiseReturnType<typeof getEventDemandSnapshot>
