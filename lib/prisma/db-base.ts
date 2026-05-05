import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { Pool, neonConfig } from '@neondatabase/serverless'
import ws from 'ws'

/**
 * DATABASE BASE LAYER (Raw Client)
 * 
 * Optimized for local dev environments using Neon Serverless adapter.
 * This resolves persistent TCP connection timeouts (5432) by using WebSockets/HTTP.
 */

const isDev = process.env.NODE_ENV === 'development'

// REQUIRED: Configure Neon to use WebSockets in Node.js environments
if (isDev) {
  neonConfig.webSocketConstructor = ws
}

// Prefer the pooler URL for the serverless driver
const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL

if (!connectionString) {
  console.error('[DB_BASE] CRITICAL: Database connection string is missing.')
}

// Helper to create the Neon Serverless adapter
const createAdapter = () => {
  if (!connectionString) return undefined
  
  // Use the verified Pool initialization from test-neon.ts
  const pool = new Pool({ connectionString })
  
  return new PrismaNeon(pool)
}

const globalForPrismaBase = globalThis as unknown as {
  prismaBase: PrismaClient | undefined
}

export const prismaBase =
  globalForPrismaBase.prismaBase ??
  new PrismaClient({
    adapter: createAdapter(),
    log: isDev ? ['error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrismaBase.prismaBase = prismaBase

export default prismaBase
