import { prismaUnfiltered } from '@/lib/prisma/client'

/**
 * Calculate percentile rank using the internal norm group (all completed sessions).
 * Percentile = (number of scores below this score / total scores) * 100
 *
 * Based on Criteria Corp methodology: percentile indicates what percentage of
 * the norm group the candidate outperformed.
 */
export function calculatePercentile(score: number, allScores: number[]): number {
  if (allScores.length === 0) return 50 // Default to 50th if no norm data
  const below = allScores.filter(s => s < score).length
  const equal = allScores.filter(s => s === score).length
  // Use midpoint method: (below + 0.5 * equal) / total * 100
  const percentile = ((below + 0.5 * equal) / allScores.length) * 100
  return Math.round(percentile * 10) / 10 // 1 decimal place
}

type CategoryKey = 'MATH' | 'ENGLISH' | 'ENGINEERING' | 'LOGICAL_REASONING' | 'PHYSICS'

interface CategoryScore {
  rawScore: number
  totalQuestions: number
  percentage: number
}

interface SubScoreResult {
  categories: Record<CategoryKey, CategoryScore>
  overallPercentage: number
}

/**
 * Calculate per-category raw scores from a session's answers.
 */
export function calculateSubScores(
  answers: { isCorrect: boolean | null; question: { category: string; points: number } }[]
): SubScoreResult {
  const categories: Record<string, { correct: number; total: number }> = {}

  for (const a of answers) {
    const cat = a.question.category
    if (!categories[cat]) categories[cat] = { correct: 0, total: 0 }
    categories[cat].total++
    if (a.isCorrect) categories[cat].correct++
  }

  const result: Record<string, CategoryScore> = {}
  let totalCorrect = 0
  let totalQuestions = 0

  for (const cat of ['MATH', 'ENGLISH', 'ENGINEERING', 'LOGICAL_REASONING', 'PHYSICS'] as const) {
    const data = categories[cat] || { correct: 0, total: 0 }
    result[cat] = {
      rawScore: data.correct,
      totalQuestions: data.total,
      percentage: data.total > 0 ? (data.correct / data.total) * 100 : 0,
    }
    totalCorrect += data.correct
    totalQuestions += data.total
  }

  return {
    categories: result as Record<CategoryKey, CategoryScore>,
    overallPercentage: totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0,
  }
}

/**
 * Fetch all completed session percentages from the norm group and calculate
 * percentile rankings for a given session's scores.
 *
 * Returns percentile data for overall + each category.
 */
export async function calculateSessionPercentiles(sessionId: string): Promise<{
  overallPercentile: number
  mathPercentile: number | null
  verbalPercentile: number | null
  engineeringPercentile: number | null
  reasoningPercentile: number | null
  physicsPercentile: number | null
}> {
  // Fetch this session's scores
  const session = await prismaUnfiltered.aptitudeTestSession.findUnique({
    where: { id: sessionId },
    select: {
      percentage: true,
      mathRawScore: true,
      mathTotalQuestions: true,
      verbalRawScore: true,
      verbalTotalQuestions: true,
      engineeringRawScore: true,
      engineeringTotalQuestions: true,
      reasoningRawScore: true,
      reasoningTotalQuestions: true,
      physicsRawScore: true,
      physicsTotalQuestions: true,
    },
  })
  if (!session || session.percentage == null) {
    return {
      overallPercentile: 50,
      mathPercentile: null,
      verbalPercentile: null,
      engineeringPercentile: null,
      reasoningPercentile: null,
      physicsPercentile: null,
    }
  }

  // Fetch all completed sessions (the internal norm group)
  const allSessions = await prismaUnfiltered.aptitudeTestSession.findMany({
    where: {
      status: { in: ['COMPLETED', 'TIMED_OUT'] },
      percentage: { not: null },
    },
    select: {
      percentage: true,
      mathRawScore: true,
      mathTotalQuestions: true,
      verbalRawScore: true,
      verbalTotalQuestions: true,
      engineeringRawScore: true,
      engineeringTotalQuestions: true,
      reasoningRawScore: true,
      reasoningTotalQuestions: true,
      physicsRawScore: true,
      physicsTotalQuestions: true,
    },
  })

  // Overall percentile
  const overallScores = allSessions.map(s => s.percentage!).filter(p => p != null)
  const overallPercentile = calculatePercentile(session.percentage, overallScores)

  // Category percentiles (use percentage within category for fair comparison)
  const calcCatPercentile = (
    rawScore: number | null,
    totalQ: number | null,
    allRaw: (number | null)[],
    allTotal: (number | null)[]
  ): number | null => {
    if (rawScore == null || totalQ == null || totalQ === 0) return null
    const myPct = (rawScore / totalQ) * 100
    const normPcts = allRaw
      .map((r, i) => {
        const t = allTotal[i]
        if (r == null || t == null || t === 0) return null
        return (r / t) * 100
      })
      .filter((p): p is number => p != null)
    return calculatePercentile(myPct, normPcts)
  }

  return {
    overallPercentile,
    mathPercentile: calcCatPercentile(
      session.mathRawScore,
      session.mathTotalQuestions,
      allSessions.map(s => s.mathRawScore),
      allSessions.map(s => s.mathTotalQuestions)
    ),
    verbalPercentile: calcCatPercentile(
      session.verbalRawScore,
      session.verbalTotalQuestions,
      allSessions.map(s => s.verbalRawScore),
      allSessions.map(s => s.verbalTotalQuestions)
    ),
    engineeringPercentile: calcCatPercentile(
      session.engineeringRawScore,
      session.engineeringTotalQuestions,
      allSessions.map(s => s.engineeringRawScore),
      allSessions.map(s => s.engineeringTotalQuestions)
    ),
    reasoningPercentile: calcCatPercentile(
      session.reasoningRawScore,
      session.reasoningTotalQuestions,
      allSessions.map(s => s.reasoningRawScore),
      allSessions.map(s => s.reasoningTotalQuestions)
    ),
    physicsPercentile: calcCatPercentile(
      session.physicsRawScore,
      session.physicsTotalQuestions,
      allSessions.map(s => s.physicsRawScore),
      allSessions.map(s => s.physicsTotalQuestions)
    ),
  }
}
