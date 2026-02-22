import { PrismaPg } from '@prisma/adapter-pg'
import { Pool, defaults } from 'pg'
import { PrismaClient } from '@prisma/client'

// Ensure we have the connection string
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined')
}

// PostgreSQL SSL settings for Neon
// Using ssl: { rejectUnauthorized: false } is usually safer for serverless/Vercel
const sslConfig = {
  rejectUnauthorized: connectionString.includes('sslmode=verify-full'),
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

const createPrismaClient = () => {
  const pool = new Pool({
    connectionString,
    ssl: sslConfig,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000, // Increased to 15s for Vercel cold starts/Neon wake-ups
  })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
