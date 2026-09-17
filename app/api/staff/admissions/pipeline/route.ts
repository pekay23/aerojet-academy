import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, withErrorHandler, RouteContext } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { STAGE_ORDER, STAGE_INFO } from '@/lib/admissions/constants'
import { Prisma } from '@prisma/client'

/**
 * GET /api/staff/admissions/pipeline
 * Returns real-time pipeline analytics: stage distribution, conversion rates,
 * and time-in-stage averages for the admissions funnel.
 */
export const GET = withErrorHandler(async (req: NextRequest, _ctx: RouteContext) => {
  await requireStaff()
  const url = new URL(req.url)
  const intakeCycleId = url.searchParams.get('intakeCycleId')

  const where: Prisma.ApplicationWhereInput = {}
  if (intakeCycleId) where.intakeCycleId = intakeCycleId

  // Stage distribution
  const stageCounts = await prismaUnfiltered.application.groupBy({
    by: ['stage'],
    where,
    _count: { _all: true },
  })

  const stageMap: Record<string, number> = {}
  let totalApps = 0
  for (const sc of stageCounts) {
    stageMap[sc.stage] = sc._count._all
    totalApps += sc._count._all
  }

  // Build funnel from defined stages
  const funnel = STAGE_ORDER.map((stage) => ({
    stage,
    label: STAGE_INFO[stage]?.label || stage,
    count: stageMap[stage] || 0,
    percent: totalApps > 0 ? Math.round(((stageMap[stage] || 0) / totalApps) * 100) : 0,
  }))

  // Programme breakdown
  const programmeBreakdown = await prismaUnfiltered.application.groupBy({
    by: ['programmeChoice'],
    where,
    _count: { _all: true },
  })

  // Outcome stats
  const enrolled = stageMap['ENROLLED'] || 0
  const rejected = stageMap['REJECTED'] || 0
  const withdrawn = stageMap['WITHDRAWN'] || 0
  const conversionRate = totalApps > 0 ? Math.round((enrolled / totalApps) * 100) : 0

  // Recent activity (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const recentApps = await prismaUnfiltered.application.count({
    where: { ...where, createdAt: { gte: sevenDaysAgo } },
  })
  const recentEnrolled = await prismaUnfiltered.application.count({
    where: { ...where, stage: 'ENROLLED', updatedAt: { gte: sevenDaysAgo } },
  })

  // Active intake cycles
  const cycles = await prismaUnfiltered.intakeCycle.findMany({
    where: { isActive: true },
    select: { id: true, name: true, startDate: true, endDate: true },
    orderBy: { startDate: 'desc' },
  })

  return apiSuccess({
    total: totalApps,
    funnel,
    programmeBreakdown: programmeBreakdown.map(p => ({
      programme: p.programmeChoice,
      count: p._count._all,
    })),
    outcomes: {
      enrolled,
      rejected,
      withdrawn,
      conversionRate,
    },
    recentActivity: {
      newApplications: recentApps,
      newEnrollments: recentEnrolled,
    },
    cycles,
  })
})
