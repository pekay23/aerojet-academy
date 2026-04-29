import prisma, { prismaUnfiltered } from '@/lib/prisma/client'

export type EventViabilityDecision =
  | 'GO'
  | 'NO_GO'
  | 'POSTPONE'
  | 'GO_WITH_UNDERFILLED_SITTINGS'
  | 'NEEDS_REVIEW'

export interface EventViabilityEvaluation {
  eventId: string
  eventName: string
  decision: EventViabilityDecision
  reasons: string[]
  metrics: {
    viabilityMode: string
    totalPools: number
    poolsMeetingThreshold: number
    poolsBelowThreshold: number
    totalConfirmedRevenue: number
    revenueTarget: number
    revenueMetPercent: number
    totalCandidates: number
    totalPaidSeats: number
    totalGuaranteedSeats: number
    candidateTarget: number | null
    seatVolumeTarget: number | null
    examinerReady: boolean
  }
  pools: Array<{
    id: string
    name: string
    status: string
    memberCount: number
    minRequired: number
    meetsThreshold: boolean
  }>
}

function hasExaminerCoverage(event: {
  isExaminerConfirmed: boolean
  confirmedExaminerCount: number
}) {
  return event.isExaminerConfirmed || event.confirmedExaminerCount > 0
}

export async function evaluateEventViability(
  eventId: string,
  options?: { unfiltered?: boolean }
): Promise<EventViabilityEvaluation> {
  const db = options?.unfiltered ? prismaUnfiltered : prisma
  const event = await db.examEvent.findUnique({
    where: { id: eventId },
    include: {
      pools: true,
      examBookings: {
        where: {
          status: { notIn: ['FAILED'] },
          deletedAt: null,
        },
        select: {
          id: true,
          amountPaid: true,
          guaranteeType: true,
          guaranteedSeat: true,
          status: true,
        },
      },
    },
  })

  if (!event) {
    throw new Error('Event not found')
  }

  const reasons: string[] = []
  const poolEvals = event.pools.map((pool) => ({
    id: pool.id,
    name: pool.name,
    status: pool.status,
    memberCount: pool.currentMemberCount,
    minRequired: pool.minCandidates,
    meetsThreshold: pool.currentMemberCount >= pool.minCandidates,
  }))

  const poolsBelowThreshold = poolEvals.filter((pool) => !pool.meetsThreshold)
  const totalCandidates = poolEvals.reduce((sum, pool) => sum + pool.memberCount, 0)
  const totalRevenue = event.examBookings.reduce((sum, booking) => sum + Number(booking.amountPaid || 0), 0)
  const totalPaidSeats = event.examBookings.length
  const totalGuaranteedSeats = event.examBookings.filter(
    (booking) => booking.guaranteedSeat || booking.guaranteeType !== 'POOL_FLEX'
  ).length

  const revenueTarget = Number(event.minRevenueTarget || 0)
  const candidateTarget = event.minCandidateTarget ?? null
  const seatVolumeTarget = event.minSeatVolumeTarget ?? null
  const revenueMet = revenueTarget <= 0 || totalRevenue >= revenueTarget
  const candidateTargetMet = candidateTarget == null || totalCandidates >= candidateTarget
  const seatVolumeTargetMet = seatVolumeTarget == null || totalPaidSeats >= seatVolumeTarget
  const examinerReady = hasExaminerCoverage(event)

  let thresholdMet = false
  switch (event.viabilityMode) {
    case 'CANDIDATE_COUNT':
      thresholdMet = candidateTargetMet
      break
    case 'SEAT_VOLUME':
      thresholdMet = seatVolumeTargetMet
      break
    case 'REVENUE':
      thresholdMet = revenueMet
      break
    case 'HYBRID':
    default:
      thresholdMet = revenueMet && candidateTargetMet && seatVolumeTargetMet
      break
  }

  let decision: EventViabilityDecision
  if (event.overrideStatus === 'FORCE_GO') {
    decision = poolsBelowThreshold.length > 0 ? 'GO_WITH_UNDERFILLED_SITTINGS' : 'GO'
    reasons.push('Admin override forcing event to proceed.')
  } else if (event.overrideStatus === 'FORCE_NO_GO') {
    decision = 'NO_GO'
    reasons.push('Admin override forcing event cancellation.')
  } else if (!thresholdMet && totalPaidSeats === 0 && totalGuaranteedSeats === 0) {
    decision = 'NO_GO'
    reasons.push('No viable paid or guaranteed demand remains for this event.')
  } else if (!thresholdMet) {
    decision = 'NEEDS_REVIEW'
    reasons.push('Event demand does not yet satisfy the configured viability thresholds.')
  } else if (!examinerReady) {
    decision = 'NEEDS_REVIEW'
    reasons.push('Demand thresholds are met, but examiner coverage is not yet confirmed.')
  } else if (poolsBelowThreshold.length > 0) {
    decision = 'GO_WITH_UNDERFILLED_SITTINGS'
    reasons.push('Event demand is viable overall, but one or more pools remain underfilled.')
  } else {
    decision = 'GO'
    reasons.push('Event-level demand and staffing thresholds are satisfied.')
  }

  if (!revenueMet) {
    reasons.push(
      `Revenue EUR ${totalRevenue.toFixed(0)} is below target EUR ${revenueTarget.toFixed(0)}.`
    )
  }
  if (!candidateTargetMet && candidateTarget != null) {
    reasons.push(`Candidate count ${totalCandidates} is below target ${candidateTarget}.`)
  }
  if (!seatVolumeTargetMet && seatVolumeTarget != null) {
    reasons.push(`Paid seat volume ${totalPaidSeats} is below target ${seatVolumeTarget}.`)
  }
  if (poolsBelowThreshold.length > 0) {
    reasons.push(
      `${poolsBelowThreshold.length} pool(s) remain below pool threshold: ${poolsBelowThreshold
        .map((pool) => `${pool.name} (${pool.memberCount}/${pool.minRequired})`)
        .join(', ')}`
    )
  }

  return {
    eventId: event.id,
    eventName: event.name,
    decision,
    reasons,
    metrics: {
      viabilityMode: event.viabilityMode,
      totalPools: event.pools.length,
      poolsMeetingThreshold: poolEvals.filter((pool) => pool.meetsThreshold).length,
      poolsBelowThreshold: poolsBelowThreshold.length,
      totalConfirmedRevenue: totalRevenue,
      revenueTarget,
      revenueMetPercent: revenueTarget > 0 ? Math.round((totalRevenue / revenueTarget) * 100) : 100,
      totalCandidates,
      totalPaidSeats,
      totalGuaranteedSeats,
      candidateTarget,
      seatVolumeTarget,
      examinerReady,
    },
    pools: poolEvals,
  }
}
