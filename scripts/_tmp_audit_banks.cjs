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
  // 1. Banks per course
  const banksByCourse = await p.internalExamBank.groupBy({
    by: ['courseId'],
    _count: true,
  })
  const courses = await p.course.findMany({
    where: { id: { in: banksByCourse.map((b) => b.courseId) } },
    select: { id: true, code: true, name: true },
  })
  const cMap = new Map(courses.map((c) => [c.id, c]))
  console.log('=== BANKS PER COURSE ===')
  for (const b of banksByCourse) {
    const c = cMap.get(b.courseId)
    console.log(`${(c?.code || '?').padEnd(8)} ${b._count} bank(s)  ${c?.name || ''}`)
  }

  // 2. Courses with no bank
  const allCourses = await p.course.count({ where: { isActive: true } })
  const coursesWithBank = banksByCourse.length
  console.log(`\n=== COVERAGE === active courses with bank: ${coursesWithBank} / ${allCourses}`)

  // 3. Question count per bank
  console.log('\n=== QUESTIONS PER BANK ===')
  const banks = await p.internalExamBank.findMany({
    include: {
      course: { select: { code: true, name: true } },
      _count: { select: { questions: true } },
    },
    orderBy: [{ course: { code: 'asc' } }, { name: 'asc' }],
  })
  for (const b of banks) {
    console.log(`${b.course.code.padEnd(8)} | ${b.name.padEnd(28)} | ${b._count.questions} q | active=${b.isActive}`)
  }

  // 4. Sample questions in M4
  const m4 = banks.find((b) => b.course.code === 'M4')
  if (m4) {
    const qs = await p.internalExamQuestion.findMany({
      where: { bankId: m4.id },
      select: {
        id: true,
        text: true,
        difficulty: true,
        status: true,
        createdAt: true,
        subTopic: true,
        submittedById: true,
        sortOrder: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })
    console.log(`\n=== SAMPLE M4 QUESTIONS (latest 5 of ${m4._count.questions}) ===`)
    qs.forEach((q) =>
      console.log(
        `[${q.status.padEnd(10)}] ${q.difficulty.padEnd(6)} | sort=${q.sortOrder ?? '∅'} | ${q.text.slice(0, 60)}…`
      )
    )
  }

  // 5. Per-status totals
  const byStatus = await p.internalExamQuestion.groupBy({
    by: ['status'],
    _count: true,
  })
  console.log('\n=== QUESTIONS BY STATUS ===')
  byStatus.forEach((s) => console.log(`${s.status.padEnd(18)} ${s._count}`))

  await p.$disconnect()
}
main().catch((e) => {
  console.error('ERR', e.message)
  process.exit(1)
})
