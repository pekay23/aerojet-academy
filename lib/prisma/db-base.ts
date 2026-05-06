import path from 'path'
import dotenv from 'dotenv'
import fs from 'fs'

try {
  const envPath = path.resolve(process.cwd(), '.env')
  if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath, 'utf-8'))
    for (const k in envConfig) {
      if (!process.env[k] || process.env[k] === '') {
        process.env[k] = envConfig[k]
      }
    }
  }
} catch (e) {
  console.warn('[DB_BASE] Sharing-safe .env read failed:', e)
}

import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { Pool, neonConfig } from '@neondatabase/serverless'
import ws from 'ws'

const isDev = process.env.NODE_ENV === 'development'
const isBuild = process.env.NEXT_PHASE === 'phase-production-build'

/**
 * DATABASE BASE LAYER (Raw Client)
 * 
 * Optimized for local dev environments using Neon Serverless adapter.
 * This resolves persistent TCP connection timeouts (5432) by using WebSockets/HTTP.
 */

// REQUIRED: Configure Neon to use WebSockets in all Node.js environments (dev, build, and prod)
neonConfig.webSocketConstructor = ws

// Prefer the pooler URL for the serverless driver
const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL

if (!connectionString) {
  console.warn('[DB_BASE] WARNING: Database connection string is missing. Prerendering might fail.')
} else if (isDev || isBuild) {
  try {
    const host = new URL(connectionString.replace('postgresql://', 'http://')).hostname
    console.log(`[DB_BASE] Initializing Neon adapter for: ${host}`)
  } catch (e) {
    console.log('[DB_BASE] Initializing Neon adapter.')
  }
}

// Helper to create the Neon Serverless adapter
const createAdapter = () => {
  if (!connectionString) return undefined
  
  // Use the verified Pool initialization from test-neon.ts
  // Cast to any to resolve version-specific type mismatches between the driver and adapter
  const pool = new Pool({ connectionString })
  
  return new PrismaNeon(pool as any)
}

const globalForPrismaBase = globalThis as unknown as {
  prismaBase: PrismaClient | undefined
}

export const prismaBase =
  globalForPrismaBase.prismaBase ??
  new PrismaClient({
    adapter: createAdapter(),
    log: ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrismaBase.prismaBase = prismaBase

export default prismaBase
