import 'dotenv/config'
import { createRequire } from 'node:module'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

/**
 * DATABASE BASE LAYER (Raw Client)
 *
 * This client provides raw database access for the Identity (Auth) system.
 * Production uses the standard @prisma/adapter-pg path for Vercel stability.
 * Local development may use Neon's WebSocket adapter when TCP pg handshakes
 * stall against a remote Neon URL.
 */

const require = createRequire(import.meta.url)

const isDev = process.env.NODE_ENV === 'development'
const isVercel = Boolean(process.env.VERCEL)
const localAdapterOverride = process.env.AEROJET_LOCAL_DB_ADAPTER?.toLowerCase()

// App runtime should use the pooler by default. DIRECT_URL remains the right
// default for Prisma CLI/migrations, but it is less reliable for next dev.
const dbConnectionString = isDev
  ? process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL || process.env.DIRECT_URL
  : process.env.DATABASE_URL || process.env.DIRECT_URL

const isNeonConnection = (() => {
  if (!dbConnectionString) return false
  try {
    return new URL(dbConnectionString.replace('postgresql://', 'postgres://')).hostname.endsWith(
      '.neon.tech'
    )
  } catch {
    return false
  }
})()

const useLocalNeonAdapter =
  isDev &&
  !isVercel &&
  localAdapterOverride !== 'pg' &&
  (localAdapterOverride === 'neon' || isNeonConnection)

if (!dbConnectionString) {
  console.error('[DB_BASE] CRITICAL: Database connection string is missing from environment.')
} else if (isDev) {
  try {
    const host = new URL(dbConnectionString.replace('postgresql://', 'http://')).hostname
    const adapter = useLocalNeonAdapter ? 'neon-websocket' : 'pg'
    console.log(`[DB_BASE] Initializing ${adapter} adapter to: ${host}`)
  } catch (e) {
    console.log('[DB_BASE] Initializing database adapter with provided string.')
  }
}

const createPgAdapter = () => {
  const pool = new Pool({
    connectionString: dbConnectionString,
    max: isDev ? 5 : 20,
    connectionTimeoutMillis: isDev ? Number(process.env.DB_CONNECT_TIMEOUT_MS ?? 10000) : 60000,
    idleTimeoutMillis: isDev ? 10000 : 30000,
    allowExitOnIdle: isDev,
  })

  pool.on('error', (err) => {
    console.error('[DB_BASE] Unexpected error on idle client:', err.message)
  })

  return new PrismaPg(pool)
}

const createLocalNeonAdapter = () => {
  const { PrismaNeon } = require('@prisma/adapter-neon') as typeof import('@prisma/adapter-neon')

  return new PrismaNeon({
    connectionString: dbConnectionString,
  })
}

const createAdapter = () => {
  if (useLocalNeonAdapter) {
    return createLocalNeonAdapter()
  }

  return createPgAdapter()
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

export default prismaBase
