import { env } from '@/lib/env'
import { Pool, neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from '@prisma/client'
import ws from 'ws'

const connectionString = env.DATABASE_URL

if (process.env.NODE_ENV === 'development') {
  const maskedUrl = connectionString.replace(/:([^:@]+)@/, ':****@')
  console.log('Prisma connecting to:', maskedUrl)
}

// In Node.js, Neon Serverless requires the ws package
neonConfig.webSocketConstructor = ws

const globalForPrisma = globalThis as unknown as { prisma_aja: PrismaClient }

const createPrismaClient = () => {
  const isDev = env.NODE_ENV === 'development'

  const pool = new Pool({ connectionString })
  const adapter = new PrismaNeon(pool)
  
  return new PrismaClient({
    adapter,
    log: isDev ? ['query', 'error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma_aja ?? createPrismaClient()

if (env.NODE_ENV !== 'production') globalForPrisma.prisma_aja = prisma as PrismaClient

export default prisma as unknown as PrismaClient
