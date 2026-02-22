import { PrismaPg } from '@prisma/adapter-pg'
import { Pool, defaults } from 'pg'
import { PrismaClient } from '@prisma/client'

// Ensure we have the connection string
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined')
}

// PostgreSQL SSL settings for Neon
// Using ssl: true or an object with rejectUnauthorized: false depending on env
const sslConfig = connectionString.includes('sslmode=verify-full')
  ? { rejectUnauthorized: true }
  : { rejectUnauthorized: false }

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

const createPrismaClient = () => {
  const pool = new Pool({
    connectionString,
    ssl: sslConfig,
    max: 10, // Limit connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
