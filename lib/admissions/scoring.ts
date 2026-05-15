import { prismaUnfiltered } from '@/lib/prisma/client'
import { getShortlistConfig } from '@/lib/settings'

export interface ScoringResult {
  applicationId: string
  compositeScore: number
  aptitudeScore: number
  aptitudePercentile: number | null
  profileScore: number
  referralScore: number
  experienceScore: number
  interviewScore: number | null
  interviewEvaluatorCount: number
  isAutoShortlist: boolean
  isAutoReject: boolean
  // Criteria-style sub-scores
  mathRawScore: number | null
  mathPercentile: number | null
  verbalRawScore: number | null
  verbalPercentile: number | null
  engineeringRawScore: number | null
  engineeringPercentile: number | null
  reasoningRawScore: number | null
  reasoningPercentile: number | null
}

interface ApplicationForScoring {
  id: string
  metadata: unknown
  user: {
    profile: {
      firstName: string | null
      lastName: string | null
      phone: string | null
      country: string | null
      city: string | null
      dateOfBirth: Date | null
      nationality: string | null
    } | null
    aptitudeTestSessions: {
      percentage: number | null
      overallPercentile: number | null
      mathRawScore: number | null
      mathPercentile: number | null
      verbalRawScore: number | null
      verbalPercentile: number | null
      engineeringRawScore: number | null
      engineeringPercentile: number | null
      reasoningRawScore: number | null
      reasoningPercentile: number | null
    }[]
  }
  interviewEvaluations?: {
    personalScore: number
  }[]
}

/**
 * Calculate composite score for an application.
 * Incorporates Criteria-style aptitude metrics (percentiles + sub-scores)
 * and averaged interview evaluation scores.
 *
 * Composite = aptitude% × weight + profile% × weight + interview% × weight + experience × weight
 */
export async function calculateApplicationScore(
  applicationOrId: string | ApplicationForScoring,
): Promise<ScoringResult | null> {
  let application: ApplicationForScoring | null

  if (typeof applicationOrId === 'string') {
    application = await prismaUnfiltered.application.findUnique({
      where: { id: applicationOrId },
      include: {
        user: {
          include: {
            profile: true,
            aptitudeTestSessions: {
              where: { status: 'COMPLETED' },
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: {
                percentage: true,
                overallPercentile: true,
                mathRawScore: true,
                mathPercentile: true,
                verbalRawScore: true,
                verbalPercentile: true,
                engineeringRawScore: true,
                engineeringPercentile: true,
                reasoningRawScore: true,
                reasoningPercentile: true,
              },
            },
          },
        },
        interviewEvaluations: {
          select: { personalScore: true },
        },
      },
    })
  } else {
    application = applicationOrId
  }

  if (!application) return null

  const config = await getShortlistConfig()

  // 1. Aptitude Score (percentage from test)
  let aptitudeScore = 0
  let aptitudePercentile: number | null = null
  let mathRawScore: number | null = null
  let mathPercentile: number | null = null
  let verbalRawScore: number | null = null
  let verbalPercentile: number | null = null
  let engineeringRawScore: number | null = null
  let engineeringPercentile: number | null = null
  let reasoningRawScore: number | null = null
  let reasoningPercentile: number | null = null

  const session = application.user.aptitudeTestSessions?.[0]
  if (session) {
    aptitudeScore = session.percentage ?? 0
    aptitudePercentile = session.overallPercentile ?? null
    mathRawScore = session.mathRawScore ?? null
    mathPercentile = session.mathPercentile ?? null
    verbalRawScore = session.verbalRawScore ?? null
    verbalPercentile = session.verbalPercentile ?? null
    engineeringRawScore = session.engineeringRawScore ?? null
    engineeringPercentile = session.engineeringPercentile ?? null
    reasoningRawScore = session.reasoningRawScore ?? null
    reasoningPercentile = session.reasoningPercentile ?? null
  }

  // 2. Profile Completeness Score
  let profileScore = 0
  const profile = application.user.profile
  if (profile) {
    let completedFields = 0
    const totalFields = 7

    if (profile.firstName) completedFields++
    if (profile.lastName) completedFields++
    if (profile.phone) completedFields++
    if (profile.country) completedFields++
    if (profile.city) completedFields++
    if (profile.dateOfBirth) completedFields++
    if (profile.nationality) completedFields++

    profileScore = (completedFields / totalFields) * 100
  }

  // 3. Referral Score (reserved for future referral tracking)
  const referralScore = 0

  // 4. Interview Evaluation Score (averaged personalScore from all evaluators)
  let interviewScore: number | null = null
  let interviewEvaluatorCount = 0
  const evals = application.interviewEvaluations
  if (evals && evals.length > 0) {
    interviewEvaluatorCount = evals.length
    const totalPersonalScore = evals.reduce((sum, e) => sum + e.personalScore, 0)
    interviewScore = totalPersonalScore / evals.length
  }

  // 5. Experience Score (manual staff input stored in metadata)
  let experienceScore = 0
  const metadata = application.metadata as Record<string, unknown> | null
  if (metadata && metadata.experienceScore !== undefined) {
    experienceScore = Number(metadata.experienceScore)
  }

  // Calculate composite using configurable weights
  // If interview evaluations exist, use the referral weight slot for interview
  // (interview replaces referral in the weighted formula since referral is reserved)
  const interviewContribution = interviewScore !== null
    ? interviewScore * (config.shortlist_referral_weight / 100)
    : referralScore * (config.shortlist_referral_weight / 100)

  const compositeScore =
    aptitudeScore * (config.shortlist_aptitude_weight / 100) +
    profileScore * (config.shortlist_profile_weight / 100) +
    interviewContribution +
    experienceScore * (config.shortlist_experience_weight / 100)

  return {
    applicationId: application.id,
    compositeScore: Math.round(compositeScore * 10) / 10,
    aptitudeScore: Math.round(aptitudeScore * 10) / 10,
    aptitudePercentile,
    profileScore: Math.round(profileScore * 10) / 10,
    referralScore: Math.round(referralScore * 10) / 10,
    experienceScore: Math.round(experienceScore * 10) / 10,
    interviewScore: interviewScore !== null ? Math.round(interviewScore * 10) / 10 : null,
    interviewEvaluatorCount,
    isAutoShortlist: compositeScore >= config.shortlist_auto_threshold,
    isAutoReject: compositeScore <= config.shortlist_auto_reject_threshold,
    mathRawScore,
    mathPercentile,
    verbalRawScore,
    verbalPercentile,
    engineeringRawScore,
    engineeringPercentile,
    reasoningRawScore,
    reasoningPercentile,
  }
}
