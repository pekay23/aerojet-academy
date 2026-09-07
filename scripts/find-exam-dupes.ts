import prisma from '../lib/prisma/client'

async function findDuplicates() {
  const allResults = await prisma.examResult.findMany({
    include: {
      user: { select: { email: true } }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Group by userId + moduleCode
  const groups: Record<string, unknown[]> = {}
  for (const r of allResults) {
    if (!r.moduleCode) continue
    const key = `${r.userId}_${r.moduleCode.toUpperCase()}`
    if (!groups[key]) groups[key] = []
    groups[key].push(r)
  }

  let dupesCount = 0
  for (const key in groups) {
    const records = groups[key]
    if (records.length > 1) {
      dupesCount++
      console.log(`\nDuplicate found for ${records[0].user.email} - Module: ${records[0].moduleCode}`)
      for (const r of records) {
        console.log(`  - ID: ${r.id} | Score: ${r.score} | Passed: ${r.passed} | Notes: ${r.sourceNotes} | Date: ${r.createdAt.toISOString()}`)
      }
    }
  }

  console.log(`\nFound ${dupesCount} students with duplicate module records.`)
  await prisma.$disconnect()
}

findDuplicates().catch(e => {
  console.error(e)
  process.exit(1)
})


