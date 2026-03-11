
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPools() {
  const pools = await prisma.examPool.findMany({
    where: {
      name: { contains: 'Auto Pool' }
    },
    select: {
      name: true,
      isAutoPool: true,
    }
  });

  console.log("Auto Pools in DB:", JSON.stringify(pools, null, 2));
}

checkPools().catch(console.error).finally(() => prisma.$disconnect());
