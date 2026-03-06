const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const pools = await prisma.examPool.findMany({
    include: {
      memberships: {
        include: { user: { include: { profile: true } } },
      },
    },
  })

  console.log('Total pools:', pools.length)
  for (const pool of pools) {
    console.log(`Pool ${pool.name} [${pool.id}] - Members: ${pool.memberships.length}`)
    for (const member of pool.memberships) {
      console.log(`  - Member: ${member.id}, User: ${member.userId}, Status: ${member.status}`)
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
