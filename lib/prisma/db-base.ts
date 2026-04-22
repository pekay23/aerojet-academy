import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

/**
 * DATABASE BASE LAYER (Raw Client)
 * 
 * This client provides raw database access for the Identity (Auth) system.
 * We use the standard @prisma/adapter-pg here as it is more stable in the 
 * current development environment than the serverless Neon adapter.
 */

const isDev = process.env.NODE_ENV === 'development'
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('[DB_BASE] CRITICAL: DATABASE_URL is missing from environment.')
}

// Helper to create the standard PG adapter
const createAdapter = () => {
  const pool = new Pool({ connectionString })
  return new PrismaPg(pool)
}

const globalForPrismaBase = globalThis as unknown as {
  prismaBase: PrismaClient | undefined
}

export const prismaBase =
  globalForPrismaBase.prismaBase ??
  new PrismaClient({
    adapter: createAdapter(),
    log: isDev ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrismaBase.prismaBase = prismaBase

// Trigger hot reload after schema pushBase

export default prismaBase
