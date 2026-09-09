import prisma from '../lib/prisma/client'

async function main() {
  const courses = await prisma.course.findMany({
    where: { code: { startsWith: 'M11' } },
    include: { examComponents: true },
    orderBy: { code: 'asc' },
  })
  for (const c of courses) {
    console.log(`Course: ${c.code} — ${c.name}`)
    for (const ec of c.examComponents) {
      console.log(`  Comp: ${ec.code} | ${ec.name} | type=${ec.type} | cat=${ec.categoryCode}`)
    }
  }
  if (courses.length === 0) console.log('No M11 courses found.')
  await prisma.$disconnect()
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
