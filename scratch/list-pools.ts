import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_lPmU1f4rKBkj@ep-wandering-wave-ahyik1io-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&uselibpqcompat=true&channel_binding=require&connection_limit=50&pool_timeout=30"
    }
  }
})

async function main() {
  const pools = await prisma.examPool.findMany({
    select: { id: true, name: true }
  })
  console.log(JSON.stringify(pools, null, 2))
}

main().finally(() => prisma.$disconnect())
