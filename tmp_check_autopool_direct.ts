
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkPools() {
  const pools = await prisma.examPool.findMany({
    where: {
      name: { contains: 'Auto Pool' }
    },
    select: {
      id: true,
      name: true,
      isAutoPool: true,
      poolType: true,
      status: true
    }
  });

  console.log("Auto Pools in DB:");
  console.dir(pools, { depth: null });
}

checkPools().catch(console.error).finally(() => prisma.$disconnect());
