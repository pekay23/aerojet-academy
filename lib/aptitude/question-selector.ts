import { prismaUnfiltered } from '@/lib/prisma/client'

interface SelectionConfig {
  MATH: number
  ENGLISH: number
  ENGINEERING: number
  LOGICAL_REASONING: number
  PHYSICS: number
}

function shuffle<T>(array: T[]): T[] {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

export async function selectQuestions(bankId: string, counts: SelectionConfig) {
  // Fetch questions ordered by least-served first for fair rotation
  const allQuestions = await prismaUnfiltered.aptitudeQuestion.findMany({
    where: { bankId, isActive: true },
    select: {
      id: true,
      category: true,
      questionType: true,
      difficulty: true,
      points: true,
      timesServed: true,
      lastServedAt: true,
    },
    orderBy: [
      { timesServed: 'asc' },
      { lastServedAt: 'asc' },
    ],
  })

  const selectedQuestionIds: string[] = []

  for (const [category, count] of Object.entries(counts)) {
    if (count <= 0) continue

    const categoryQuestions = allQuestions.filter(q => q.category === category)

    // Group by timesServed to pick from least-exposed tier first
    const minServed = categoryQuestions[0]?.timesServed ?? 0
    const leastServed = categoryQuestions.filter(q => q.timesServed === minServed)

    // If the least-served tier has enough, shuffle and pick from it;
    // otherwise take all least-served + fill from the rest
    let pool: typeof categoryQuestions
    if (leastServed.length >= count) {
      pool = shuffle(leastServed).slice(0, count)
    } else {
      const remaining = categoryQuestions.filter(q => q.timesServed > minServed)
      pool = [...leastServed, ...shuffle(remaining).slice(0, count - leastServed.length)]
    }

    selectedQuestionIds.push(...pool.map(q => q.id))
  }

  // Update exposure tracking for selected questions
  if (selectedQuestionIds.length > 0) {
    await prismaUnfiltered.aptitudeQuestion.updateMany({
      where: { id: { in: selectedQuestionIds } },
      data: {
        timesServed: { increment: 1 },
        lastServedAt: new Date(),
      },
    })
  }

  // Shuffle final list so categories are interleaved
  return shuffle(selectedQuestionIds)
}
