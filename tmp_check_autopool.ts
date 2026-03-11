
import prisma from './lib/prisma/client';

async function checkPools() {
  const pools = await prisma.examPool.findMany({
    where: {
      poolType: 'AUTO'
    },
    select: {
      name: true,
      isAutoPool: true,
    }
  });

  console.log(JSON.stringify(pools, null, 2));

  const standardPools = await prisma.examPool.findMany({
    where: {
      name: { contains: 'Auto' }
    },
    select: {
      name: true,
      isAutoPool: true,
    }
  });
  console.log("Standard pools with 'Auto' in name:", JSON.stringify(standardPools, null, 2));
}

checkPools().catch(console.error);
