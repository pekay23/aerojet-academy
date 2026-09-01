// Check existing test users in the database using project's prisma setup
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { PrismaClient } = require('@prisma/client')
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL || '' })
const prisma = new PrismaClient({ adapter })

async function main() {
  const users = await prisma.user.findMany({
    where: { role: { in: ['STUDENT', 'STAFF', 'INSTRUCTOR', 'APPLICANT', 'EXAMINER'] } },
    select: { email: true, role: true, status: true }
  })
  console.log('Existing test users:', JSON.stringify(users, null, 2))

  const examiner = await prisma.user.findUnique({
    where: { email: 'examiner@aerojet-academy.com' },
    select: { email: true, role: true }
  })
  console.log('Examiner user exists:', !!examiner)
}

main().catch(e => { console.error(e.message); process.exit(1); }).finally(() => prisma.$disconnect());
