import { prismaUnfiltered } from '../lib/prisma/client'
import type { InternalExamBank } from '@prisma/client'

async function main() {
  const banks = await prismaUnfiltered.internalExamBank.findMany({
    orderBy: { createdAt: 'asc' },
  })

  console.log(`\n=== INTERNAL EXAM BANKS (${banks.length} total) ===`)
  for (const b of banks) {
    console.log(
      JSON.stringify(
        {
          id: b.id,
          name: b.name,
          moduleCode: b.moduleCode,
          courseId: b.courseId,
          mcqCount: b.mcqCount,
          minimumPoolSize: b.minimumPoolSize,
          isActive: b.isActive,
          ruleSet: b.ruleSet,
          description: b.description,
          categoryCode: b.categoryCode,
          certificateEnabled: b.certificateEnabled,
          reviewState: b.reviewState,
          reviewNote: b.reviewNote,
          reviewedAt: b.reviewedAt,
          reviewedById: b.reviewedById,
          sebConfig: b.sebConfig,
          categoryConfig: b.categoryConfig,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
        },
        null,
        2
      )
    )
  }

  const questions = await prismaUnfiltered.internalExamQuestion.findMany({
    orderBy: { createdAt: 'asc' },
  })

  console.log(`\n=== INTERNAL EXAM QUESTIONS (${questions.length} total) ===`)
  for (const q of questions) {
    console.log(
      JSON.stringify(
        {
          id: q.id,
          bankId: q.bankId,
          text: q.text,
          options: q.options,
          correctAnswer: q.correctAnswer,
          points: q.points,
          subTopic: q.subTopic,
          difficulty: q.difficulty,
          isEssay: q.isEssay,
          essayTimeMins: q.essayTimeMins,
          timesServed: q.timesServed,
          lastServedAt: q.lastServedAt,
          sortOrder: q.sortOrder,
          isActive: q.isActive,
          knowledgeLevel: q.knowledgeLevel,
          reviewNote: q.reviewNote,
          reviewedAt: q.reviewedAt,
          reviewedById: q.reviewedById,
          status: q.status,
          submittedById: q.submittedById,
          syllabusRef: q.syllabusRef,
          explanation: q.explanation,
          aiSourceRef: q.aiSourceRef,
          aiConfidence: q.aiConfidence,
          aiSolvedAt: q.aiSolvedAt,
          createdAt: q.createdAt,
          updatedAt: q.updatedAt,
        },
        null,
        2
      )
    )
  }

  const easaBanks = banks.filter((b: InternalExamBank) => b.id.startsWith('easa-'))
  console.log(`\n=== EASA BANKS (${easaBanks.length} total) ===`)
  for (const b of easaBanks) {
    console.log(
      JSON.stringify(
        {
          id: b.id,
          name: b.name,
          moduleCode: b.moduleCode,
          courseId: b.courseId,
          mcqCount: b.mcqCount,
          minimumPoolSize: b.minimumPoolSize,
          isActive: b.isActive,
          ruleSet: b.ruleSet,
          description: b.description,
          categoryCode: b.categoryCode,
          certificateEnabled: b.certificateEnabled,
          reviewState: b.reviewState,
          reviewNote: b.reviewNote,
          reviewedAt: b.reviewedAt,
          reviewedById: b.reviewedById,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
        },
        null,
        2
      )
    )
  }

  await prismaUnfiltered.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
