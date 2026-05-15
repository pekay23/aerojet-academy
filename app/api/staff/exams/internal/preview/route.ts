import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'

/**
 * GET /api/staff/exams/internal/preview?bankId=xxx
 *
 * Returns a randomised preview set of questions from an internal exam bank,
 * matching the live EASA exam format (mcqCount questions, 3 options each).
 * No session is created — read-only preview for staff.
 */
export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireStaff()

  const bankId = req.nextUrl.searchParams.get('bankId')
  if (!bankId) return apiError('bankId is required', 400)

  const bank = await prismaUnfiltered.internalExamBank.findUnique({
    where: { id: bankId },
    include: {
      course: { select: { id: true, name: true, code: true } },
      ruleOverride: true,
    },
  })
  if (!bank) return apiError('Bank not found', 404)

  const questions = await prismaUnfiltered.internalExamQuestion.findMany({
    where: { bankId, isActive: true },
    select: {
      id: true,
      text: true,
      options: true,
      correctAnswer: true,
      subTopic: true,
      difficulty: true,
      points: true,
    },
  })

  // Shuffle and pick mcqCount questions (same as live exam)
  const shuffled = [...questions].sort(() => Math.random() - 0.5)
  const selected = shuffled.slice(0, bank.mcqCount)

  const rules = bank.ruleOverride
  const timePerQ = rules?.timePerQuestionSecs ?? 75
  const passMarkPct = rules?.passMarkPct ?? 75

  // Sub-topic stats
  const subTopics = new Map<string, number>()
  for (const q of questions) {
    const topic = q.subTopic || 'General'
    subTopics.set(topic, (subTopics.get(topic) || 0) + 1)
  }

  return apiSuccess({
    bank: {
      id: bank.id,
      name: bank.name,
      course: bank.course,
      mcqCount: bank.mcqCount,
      ruleSet: bank.ruleSet,
    },
    config: {
      timePerQuestionSecs: timePerQ,
      totalTimeSecs: timePerQ * bank.mcqCount,
      passMarkPct,
      totalQuestions: selected.length,
      poolSize: questions.length,
    },
    subTopics: Array.from(subTopics.entries()).map(([topic, count]) => ({ topic, count })),
    questions: selected.map((q, i) => ({
      index: i,
      questionId: q.id,
      text: q.text,
      options: q.options,
      correctAnswer: q.correctAnswer,
      subTopic: q.subTopic,
      difficulty: q.difficulty,
      points: q.points,
    })),
  })
})
