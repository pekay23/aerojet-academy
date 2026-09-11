import 'server-only'
import { prismaUnfiltered as defaultPrisma } from '@/lib/prisma/client'
import { subDays, subMonths, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns'
import { AnalyticsEventName, AnalyticsEntity } from './events'

// Allow injecting a prisma client for testing
type PrismaLike = typeof defaultPrisma
let prisma: PrismaLike = defaultPrisma

export function __setPrisma(client: PrismaLike) {
  prisma = client
}

// ============================================================================
// Types
// ============================================================================

export interface FunnelStep {
  event: AnalyticsEventName
  label: string
  count: number
  conversionRate: number // from step 0
  dropoffRate: number // from previous step
}

export interface FunnelMetrics {
  name: string
  from: Date
  to: Date
  steps: FunnelStep[]
  overallConversion: number
}

export interface RetentionCohort {
  cohortDate: string
  cohortSize: number
  d1: { count: number; rate: number }
  d7: { count: number; rate: number }
  d30: { count: number; rate: number }
}

export interface FeatureAdoption {
  feature: string
  totalUsers: number
  adopters: number
  adoptionRate: number
  avgTimeToAdoptDays: number | null
}

export interface PageViewMetrics {
  path: string
  views: number
  uniqueVisitors: number
  avgViewsPerVisitor: number
}

export interface UserJourneyEvent {
  event: AnalyticsEventName
  entity: string
  timestamp: string
  payload: Record<string, any>
}

// ============================================================================
// Funnel Metrics
// ============================================================================

const STANDARD_FUNNELS: Record<string, AnalyticsEventName[]> = {
  registration: ['REGISTRATION_STARTED', 'REGISTRATION_COMPLETED', 'PAYMENT_SUBMITTED', 'PAYMENT_APPROVED'],
  enrollment: ['REGISTRATION_COMPLETED', 'ENROLLMENT_CREATED', 'COURSE_ACCESSED'],
  exam: ['EXAM_POOL_JOINED', 'EXAM_COMPLETED'],
  payment: ['PAYMENT_SUBMITTED', 'PAYMENT_APPROVED'],
}

export async function getFunnelMetrics(
  funnelName: keyof typeof STANDARD_FUNNELS = 'registration',
  from?: Date,
  to?: Date,
): Promise<FunnelMetrics> {
  const now = new Date()
  const start = from ?? subDays(now, 30)
  const end = to ?? now
  const events = STANDARD_FUNNELS[funnelName]

  const counts = await Promise.all(
    events.map((event) =>
      prisma.auditLog.count({
        where: {
          action: event,
          entity: 'ANALYTICS',
          createdAt: { gte: start, lt: end },
        },
      }),
    ),
  )

  const steps: FunnelStep[] = events.map((event, i) => {
    const count = counts[i]
    const previousCount = i > 0 ? counts[i - 1] : count
    return {
      event,
      label: formatEventLabel(event),
      count,
      conversionRate: previousCount > 0 ? Math.round((count / previousCount) * 100) : 0,
      dropoffRate: i > 0 && previousCount > 0 ? Math.round(((previousCount - count) / previousCount) * 100) : 0,
    }
  })

  const overallConversion = steps.length >= 2 && steps[0].count > 0
    ? Math.round((steps[steps.length - 1].count / steps[0].count) * 100)
    : 0

  return {
    name: funnelName,
    from: start,
    to: end,
    steps,
    overallConversion,
  }
}

function formatEventLabel(event: string): string {
  return event
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

// ============================================================================
// Cohort Retention
// ============================================================================

export async function getCohortRetention(cohortDate?: Date): Promise<RetentionCohort[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cohortRetention: any[] = []
  
  // Get users who registered in the specified month
  const targetMonth = cohortDate ? new Date(cohortDate.getFullYear(), cohortDate.getMonth(), 1) : startOfMonth(subMonths(new Date(), 1))
  const nextMonth = startOfMonth(subMonths(targetMonth, -1))

  const cohortUsers = await prisma.user.findMany({
    where: {
      createdAt: { gte: targetMonth, lt: nextMonth },
      deletedAt: null,
    },
    select: { id: true, createdAt: true },
  })

  if (cohortUsers.length === 0) {
    return []
  }

  const userIds = cohortUsers.map((u) => u.id)

  // Check activity at D1, D7, D30
  const [d1Active, d7Active, d30Active] = await Promise.all([
    prisma.auditLog.findMany({
      where: {
        userId: { in: userIds },
        createdAt: {
          gte: new Date(targetMonth.getTime() + 1 * 24 * 60 * 60 * 1000),
          lt: new Date(targetMonth.getTime() + 2 * 24 * 60 * 60 * 1000),
        },
      },
      select: { userId: true },
      distinct: ['userId'],
    }),
    prisma.auditLog.findMany({
      where: {
        userId: { in: userIds },
        createdAt: {
          gte: new Date(targetMonth.getTime() + 7 * 24 * 60 * 60 * 1000),
          lt: new Date(targetMonth.getTime() + 8 * 24 * 60 * 60 * 1000),
        },
      },
      select: { userId: true },
      distinct: ['userId'],
    }),
    prisma.auditLog.findMany({
      where: {
        userId: { in: userIds },
        createdAt: {
          gte: new Date(targetMonth.getTime() + 30 * 24 * 60 * 60 * 1000),
          lt: new Date(targetMonth.getTime() + 31 * 24 * 60 * 60 * 1000),
        },
      },
      select: { userId: true },
      distinct: ['userId'],
    }),
  ])

  const d1Set = new Set(d1Active.map((e: any) => e.userId))
  const d7Set = new Set(d7Active.map((e: any) => e.userId))
  const d30Set = new Set(d30Active.map((e: any) => e.userId))

  return [
    {
      cohortDate: targetMonth.toISOString(),
      cohortSize: cohortUsers.length,
      d1: { count: d1Set.size, rate: cohortUsers.length > 0 ? Math.round((d1Set.size / cohortUsers.length) * 100) : 0 },
      d7: { count: d7Set.size, rate: cohortUsers.length > 0 ? Math.round((d7Set.size / cohortUsers.length) * 100) : 0 },
      d30: { count: d30Set.size, rate: cohortUsers.length > 0 ? Math.round((d30Set.size / cohortUsers.length) * 100) : 0 },
    },
  ]
}

// ============================================================================
// Feature Adoption
// ============================================================================

export async function getFeatureAdoption(feature: string, from?: Date, to?: Date): Promise<FeatureAdoption | null> {
  const now = new Date()
  const start = from ?? subMonths(now, 1)
  const end = to ?? now

  const [totalUsers, adopters] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.auditLog.findMany({
      where: {
        action: 'FEATURE_USED',
        entity: 'ANALYTICS',
        changes: { path: ['feature'], equals: feature },
        createdAt: { gte: start, lt: end },
      },
      select: { userId: true, createdAt: true },
      distinct: ['userId'],
    }),
  ])

  if (totalUsers === 0) return null

  const adoptionRate = Math.round((adopters.length / totalUsers) * 100)

  // Calculate average time to adopt (from user creation to first use)
  const avgTimeToAdopt =
    adopters.length > 0
      ? Math.round(
          adopters.reduce((sum: number, e: any) => {
            const user = { createdAt: e.createdAt }
            const adoptDate = new Date(e.createdAt)
            const days = (adoptDate.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
            return sum + days
          }, 0) / adopters.length,
        )
      : null

  return {
    feature,
    totalUsers,
    adopters: adopters.length,
    adoptionRate,
    avgTimeToAdoptDays: avgTimeToAdopt,
  }
}

// ============================================================================
// Page Views
// ============================================================================

export async function getPageViews(from?: Date, to?: Date, limit = 20): Promise<PageViewMetrics[]> {
  const now = new Date()
  const start = from ?? subDays(now, 7)
  const end = to ?? now

  const pageViews = await prisma.auditLog.groupBy({
    by: ['entityId'],
    where: {
      action: 'PAGE_VIEW',
      entity: 'ANALYTICS',
      createdAt: { gte: start, lt: end },
    },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: limit,
  })

  // Get unique visitors per page
  const uniqueVisitorsPromises = pageViews.map((pv: any) =>
    prisma.auditLog.findMany({
      where: {
        action: 'PAGE_VIEW',
        entity: 'ANALYTICS',
        entityId: pv.entityId,
        createdAt: { gte: start, lt: end },
      },
      select: { userId: true },
      distinct: ['userId'],
    }),
  )

  const uniqueVisitorsLists = await Promise.all(uniqueVisitorsPromises)

  return pageViews.map((pv: any, i: number) => ({
    path: pv.entityId,
    views: pv._count.id,
    uniqueVisitors: uniqueVisitorsLists[i].length,
    avgViewsPerVisitor: uniqueVisitorsLists[i].length > 0 ? Number((pv._count.id / uniqueVisitorsLists[i].length).toFixed(1)) : 0,
  }))
}

// ============================================================================
// User Journey
// ============================================================================

export async function getUserJourney(userId: string, limit = 50): Promise<UserJourneyEvent[]> {
  const events = await prisma.auditLog.findMany({
    where: {
      userId,
      entity: 'ANALYTICS',
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      action: true,
      entity: true,
      createdAt: true,
      changes: true,
    },
  })

  return events.map((e: any) => ({
    event: e.action as AnalyticsEventName,
    entity: e.entity ?? 'UNKNOWN',
    timestamp: e.createdAt.toISOString(),
    payload: (e.changes as Record<string, any>) ?? {},
  }))
}

// ============================================================================
// Event volume (for time-series charts)
// ============================================================================

export async function getEventVolume(from?: Date, to?: Date, groupBy: 'day' | 'week' | 'month' = 'day') {
  const now = new Date()
  const start = from ?? subDays(now, 30)
  const end = to ?? now

  const events = await prisma.auditLog.findMany({
    where: {
      entity: 'ANALYTICS',
      createdAt: { gte: start, lt: end },
    },
    select: {
      action: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  // Group by time bucket
  const buckets = new Map<string, Record<string, number>>()

  for (const event of events) {
    let key: string
    const d = event.createdAt

    switch (groupBy) {
      case 'week':
        const weekStart = startOfDay(subDays(d, d.getDay()))
        key = weekStart.toISOString().split('T')[0]
        break
      case 'month':
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        break
      default:
        key = d.toISOString().split('T')[0]
    }

    if (!buckets.has(key)) {
      buckets.set(key, {})
    }
    const bucket = buckets.get(key)!
    bucket[event.action] = (bucket[event.action] || 0) + 1
  }

  return Array.from(buckets.entries())
    .map(([date, counts]) => ({ date, ...counts }))
    .sort((a, b) => a.date.localeCompare(b.date))
}
