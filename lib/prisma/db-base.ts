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
// Use DIRECT_URL for the pool in development if available, as it's more stable
// than the pooler endpoint for long-lived dev processes.
const dbConnectionString = (isDev ? process.env.DIRECT_URL : null) || process.env.DATABASE_URL

if (!dbConnectionString) {
  console.error('[DB_BASE] CRITICAL: Database connection string is missing from environment.')
} else if (isDev) {
  try {
    const host = new URL(dbConnectionString.replace('postgresql://', 'http://')).hostname
    console.log(`[DB_BASE] Initializing connection pool to: ${host}`)
  } catch (e) {
    console.log('[DB_BASE] Initializing connection pool with provided string.')
  }
}

// Helper to create the standard PG adapter
const createAdapter = () => {
  const pool = new Pool({
    connectionString: dbConnectionString,
    max: 20, // Lowered from 50 to avoid exhausting Neon limits in dev
    connectionTimeoutMillis: 60000, // Increased to 60s for cold starts
    idleTimeoutMillis: 30000,
    allowExitOnIdle: false, // Keep connections alive longer
  })

  // Add error listener to prevent process crashes and provide better debugging
  pool.on('error', (err) => {
    console.error('[DB_BASE] Unexpected error on idle client:', err.message)
  })

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
