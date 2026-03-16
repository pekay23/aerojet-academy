import { env } from '@/lib/env'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { PrismaClient } from '@prisma/client'

const connectionString = env.DATABASE_URL

if (process.env.NODE_ENV === 'development') {
  const maskedUrl = connectionString.replace(/:([^:@]+)@/, ':****@')
  console.log('Prisma connecting to:', maskedUrl)
}

const globalForPrisma = globalThis as unknown as { prisma_aja: PrismaClient }

const createPrismaClient = () => {
  const isDev = env.NODE_ENV === 'development'
  // Neon requires SSL; in dev we relax certificate verification to avoid TLS handshake issues
  const ssl = isDev ? { rejectUnauthorized: false } : true
  const pool = new Pool({
    connectionString,
    ssl,
    max: isDev ? 5 : 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    keepAlive: true,
  })

  if (isDev) {
    pool.on('error', (err) => console.error('Prisma PgPool error:', err.message))
  }

  const adapter = new PrismaPg(pool)
  return new PrismaClient({
    adapter,
    log: isDev ? ['query', 'error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma_aja ?? createPrismaClient()

if (env.NODE_ENV !== 'production') globalForPrisma.prisma_aja = prisma as PrismaClient

export default prisma as unknown as PrismaClient
