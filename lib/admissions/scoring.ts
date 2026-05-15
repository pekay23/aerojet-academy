import { prismaUnfiltered } from '@/lib/prisma/client'
import { getShortlistConfig } from '@/lib/settings'

export interface ScoringResult {
  applicationId: string
  compositeScore: number
  aptitudeScore: number
  profileScore: number
  referralScore: number
  experienceScore: number
  isAutoShortlist: boolean
  isAutoReject: boolean
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
    }[]
  }
}

/**
 * Calculate composite score for an application.
 * Accepts pre-loaded application data to avoid N+1 queries.
 * Falls back to fetching from DB if only an ID is provided.
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
            },
          },
        },
      },
    })
  } else {
    application = applicationOrId
  }

  if (!application) return null

  const config = await getShortlistConfig()

  // 1. Aptitude Score
  let aptitudeScore = 0
  const session = application.user.aptitudeTestSessions?.[0]
  if (session && session.percentage) {
    aptitudeScore = session.percentage
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

  // 4. Experience Score (manual staff input stored in metadata)
  let experienceScore = 0
  const metadata = application.metadata as Record<string, unknown> | null
  if (metadata && metadata.experienceScore !== undefined) {
    experienceScore = Number(metadata.experienceScore)
  }

  // Calculate composite
  const compositeScore =
    (aptitudeScore * (config.shortlist_aptitude_weight / 100)) +
    (profileScore * (config.shortlist_profile_weight / 100)) +
    (referralScore * (config.shortlist_referral_weight / 100)) +
    (experienceScore * (config.shortlist_experience_weight / 100))

  return {
    applicationId: application.id,
    compositeScore: Math.round(compositeScore * 10) / 10,
    aptitudeScore: Math.round(aptitudeScore * 10) / 10,
    profileScore: Math.round(profileScore * 10) / 10,
    referralScore: Math.round(referralScore * 10) / 10,
    experienceScore: Math.round(experienceScore * 10) / 10,
    isAutoShortlist: compositeScore >= config.shortlist_auto_threshold,
    isAutoReject: compositeScore <= config.shortlist_auto_reject_threshold,
  }
}
