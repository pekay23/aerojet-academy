// Check hasCompletedTour status for all test users
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL || '' })
const prisma = new PrismaClient({ adapter })

async function main() {
  const users = await prisma.user.findMany({
    where: { role: { in: ['STUDENT', 'STAFF', 'INSTRUCTOR', 'APPLICANT', 'EXAMINER'] } },
    select: { email: true, role: true, hasCompletedTour: true }
  })
  console.log(JSON.stringify(users, null, 2))
}

main().catch(e => { console.error(e.message); process.exit(1); }).finally(() => prisma.$disconnect())
