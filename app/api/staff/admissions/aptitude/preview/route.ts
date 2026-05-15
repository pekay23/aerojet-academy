import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { getAptitudeConfig } from '@/lib/settings'

/**
 * GET /api/staff/admissions/aptitude/preview?bankId=xxx
 *
 * Returns a randomised preview set of questions matching the live test config
 * (same question counts per category, same structure applicants see).
 * No session is created — this is a read-only dry-run for staff.
 */
export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireStaff()

  const bankId = req.nextUrl.searchParams.get('bankId')
  if (!bankId) return apiError('bankId is required', 400)

  const bank = await prismaUnfiltered.aptitudeTestBank.findUnique({ where: { id: bankId } })
  if (!bank) return apiError('Bank not found', 404)

  const config = await getAptitudeConfig()

  const categoryCounts: Record<string, number> = {
    MATH: config.aptitude_math_count,
    ENGLISH: config.aptitude_english_count,
    ENGINEERING: config.aptitude_engineering_count,
    LOGICAL_REASONING: config.aptitude_reasoning_count,
    PHYSICS: config.aptitude_physics_count,
  }

  // Fetch all active questions grouped by category
  const allQuestions = await prismaUnfiltered.aptitudeQuestion.findMany({
    where: { bankId, isActive: true },
    select: {
      id: true,
      category: true,
      questionType: true,
      difficulty: true,
      text: true,
      options: true,
      correctAnswer: true,
      explanation: true,
      points: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  // Select random questions per category (same algorithm as live test)
  const previewQuestions: typeof allQuestions = []

  for (const [category, count] of Object.entries(categoryCounts)) {
    if (count <= 0) continue
    const pool = allQuestions.filter((q) => q.category === category)

    // Shuffle and pick
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    previewQuestions.push(...shuffled.slice(0, count))
  }

  // Shuffle the final set (interleave categories)
  const shuffled = previewQuestions.sort(() => Math.random() - 0.5)

  // Category stats for the info panel
  const stats = Object.entries(categoryCounts).map(([cat, requested]) => ({
    category: cat,
    requested,
    available: allQuestions.filter((q) => q.category === cat).length,
  }))

  return apiSuccess({
    bank: { id: bank.id, name: bank.name, description: bank.description },
    config: {
      timeLimitMinutes: config.aptitude_time_limit_minutes,
      passThresholdPct: config.aptitude_pass_threshold_pct,
      totalQuestions: previewQuestions.length,
    },
    stats,
    questions: shuffled.map((q, i) => ({
      index: i,
      questionId: q.id,
      category: q.category,
      questionType: q.questionType,
      difficulty: q.difficulty,
      text: q.text,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      points: q.points,
    })),
  })
})
