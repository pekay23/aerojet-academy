// Check existing test users in the database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { role: { in: ['STUDENT', 'STAFF', 'INSTRUCTOR', 'APPLICANT', 'EXAMINER'] } },
    select: { email: true, role: true, status: true }
  });
  console.log(JSON.stringify(users, null, 2));
  
  // Check if examiner user exists
  const examiner = await prisma.user.findUnique({
    where: { email: 'examiner@aerojet-academy.com' },
    select: { email: true, role: true }
  });
  console.log('Examiner user:', examiner);
}

main().catch(e => { console.error(e.message); process.exit(1); }).finally(() => prisma.$disconnect());
