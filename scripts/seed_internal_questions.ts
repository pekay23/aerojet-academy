import 'dotenv/config'
import { PrismaClient, QuestionDifficulty, QuestionStatus } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL || process.env.DIRECT_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const bank = await prisma.internalExamBank.findFirst()
  if (!bank) {
    console.log("No internal exam bank found.")
    return
  }

  console.log(`Seeding questions into bank: ${bank.name} (${bank.id})`)

  const sampleQuestions = Array.from({ length: 15 }).map((_, i) => ({
    bankId: bank.id,
    text: `Sample seeded internal exam question ${i + 1}?`,
    options: [
      'Option A is incorrect',
      'Option B is the correct answer',
      'Option C is also incorrect',
    ],
    correctAnswer: 'Option B is the correct answer',
    subTopic: `Topic ${Math.floor(i / 5) + 1}`,
    syllabusRef: `1.0.${i + 1}`,
    knowledgeLevel: (i % 3) + 1,
    difficulty: (i % 3 === 0 ? 'EASY' : i % 3 === 1 ? 'MEDIUM' : 'HARD') as QuestionDifficulty,
    points: 1,
    explanation: i % 2 === 0 ? `Explanation for question ${i + 1}: Option B is correct because...` : null,
    isEssay: false,
    isActive: true,
    status: 'APPROVED' as QuestionStatus,
  }))

  const created = await prisma.internalExamQuestion.createMany({
    data: sampleQuestions
  })

  console.log(`Successfully seeded ${created.count} APPROVED questions.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())


