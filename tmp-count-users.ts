import prisma from './lib/prisma/client'

async function main() {
  const count = await prisma.user.count()
  console.log(`Total users in DB: ${count}`)

  const studentCount = await prisma.user.count({ where: { role: 'STUDENT' } })
  console.log(`Total students: ${studentCount}`)

  const samples = await prisma.user.findMany({
    take: 10,
    select: { email: true, role: true },
  })
  console.log('Sample Users:', JSON.stringify(samples, null, 2))
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
  })
