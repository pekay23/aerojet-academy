const fs = require('fs')
const path = require('path')
try {
  const envPath = path.resolve('.env')
  if (fs.existsSync(envPath)) {
    const txt = fs.readFileSync(envPath, 'utf8')
    txt.split('\n').forEach((l) => {
      const i = l.indexOf('=')
      if (i > 0) {
        const k = l.slice(0, i).trim()
        let v = l.slice(i + 1).trim().replace(/^["']|["']$/g, '')
        if (k && !process.env[k]) process.env[k] = v
      }
    })
  }
} catch (e) {}

const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { PrismaNeon } = require('@prisma/adapter-neon')
const { Pool } = require('pg')
const url = process.env.DATABASE_URL
const adapter = url.includes('.neon.tech')
  ? new PrismaNeon({ connectionString: url })
  : new PrismaPg(new Pool({ connectionString: url }))
const p = new PrismaClient({ adapter })

async function main() {
  // Pick a bank with questions to exercise the new query path.
  const bank = await p.internalExamBank.findFirst({
    where: { questions: { some: {} } },
    include: { _count: { select: { questions: true } } },
  })
  if (!bank) {
    console.log('NO BANK WITH QUESTIONS — skipping')
    return
  }
  console.log(`Testing GET /banks/${bank.id}/questions (${bank._count.questions} questions)`)

  // Mirror the new query: sort=recent, hydrate submitter
  const questions = await p.internalExamQuestion.findMany({
    where: { bankId: bank.id },
    orderBy: [{ createdAt: 'desc' }],
  })
  const submitterIds = [
    ...new Set(questions.map((q) => q.submittedById).filter((id) => Boolean(id))),
  ]
  const submitters = submitterIds.length
    ? await p.user.findMany({
        where: { id: { in: submitterIds } },
        select: {
          id: true,
          name: true,
          profile: { select: { firstName: true, lastName: true } },
        },
      })
    : []
  console.log(
    `  sort=recent: ${questions.length} questions, ${submitters.length} unique submitters`
  )
  if (submitters[0]) {
    console.log(
      `  sample submitter: ${submitters[0].id} ${submitters[0].profile?.firstName} ${submitters[0].profile?.lastName}`
    )
  }

  // Test sort=difficulty_desc via JS-side resort
  const order = { EASY: 1, MEDIUM: 2, HARD: 3 }
  const sorted = [...questions].sort(
    (a, b) => (order[b.difficulty] ?? 99) - (order[a.difficulty] ?? 99)
  )
  console.log(
    `  sort=difficulty_desc first 3: ${sorted.slice(0, 3).map((q) => q.difficulty).join(' ')}`
  )

  // Test sort=subtopic
  const subtopicSorted = [...questions].sort((a, b) => {
    const aHas = a.subTopic ? 0 : 1
    const bHas = b.subTopic ? 0 : 1
    if (aHas !== bHas) return aHas - bHas
    return (a.subTopic ?? '').localeCompare(b.subTopic ?? '')
  })
  console.log(
    `  sort=subtopic first 3 subTopics: ${subtopicSorted
      .slice(0, 3)
      .map((q) => q.subTopic ?? '∅')
      .join(' | ')}`
  )

  // Test the bankless lookup: a course the instructor teaches with no bank
  const instructors = await p.instructorProfile.findMany({
    include: {
      classesInstructed: {
        select: {
          courseId: true,
          course: { select: { id: true, code: true, name: true } },
        },
        take: 1,
      },
    },
    take: 1,
  })
  const inst = instructors[0]
  if (inst && inst.classesInstructed[0]) {
    const courseId = inst.classesInstructed[0].courseId
    const existing = await p.internalExamBank.findFirst({ where: { courseId } })
    console.log(
      `  instructor ${inst.id} teaches course ${inst.classesInstructed[0].course.code}; bank exists? ${!!existing}`
    )
  }

  await p.$disconnect()
}
main().catch((e) => {
  console.error('ERR', e.message)
  process.exit(1)
})
