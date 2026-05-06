import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { Pool, neonConfig } from '@neondatabase/serverless'
import ws from 'ws'

const isDev = process.env.NODE_ENV === 'development'

/**
 * DATABASE BASE LAYER (Raw Client)
 *
 * Uses Neon Serverless adapter (WebSocket/HTTP) for all environments.
 * The `ws` package provides WebSocket support in Node.js (dev, build, prod).
 * On Vercel, env vars are injected automatically — no manual dotenv needed.
 */

// REQUIRED: Configure Neon to use WebSockets in all Node.js environments
neonConfig.webSocketConstructor = ws

// Helper to create the Neon Serverless adapter
const createAdapter = () => {
  const connStr = process.env.DATABASE_URL || process.env.DIRECT_URL
  if (!connStr) {
    console.error('[DB_BASE] CRITICAL: DATABASE_URL is missing from environment.')
    return undefined
  }
  if (isDev) {
    try {
      const host = new URL(connStr.replace('postgresql://', 'http://')).hostname
      console.log(`[DB_BASE] Connecting to: ${host}`)
    } catch { /* ignore */ }
  }
  return new PrismaNeon(new Pool({ connectionString: connStr }) as any)
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
