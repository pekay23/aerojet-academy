import 'server-only'
import dotenv from 'dotenv'
import path from 'node:path'
import { createRequire } from 'node:module'
import { PrismaClient } from '@prisma/client'

/**
 * DATABASE BASE LAYER (Raw Client)
 *
 * This client provides raw database access for the Identity (Auth) system.
 * Production uses the standard @prisma/adapter-pg path for Vercel stability.
 * Local development may use Neon's WebSocket adapter when TCP pg handshakes
 * stall against a remote Neon URL.
 */

// Explicitly load .env (and .env.local) — `import 'dotenv/config'` is
// unreliable in ESM/Next.js standalone builds.
// Skip on Vercel — env vars are injected automatically by the platform.
const envDir = path.resolve(process.cwd())
if (!process.env.VERCEL) {
  dotenv.config({ path: path.join(envDir, '.env') })
  dotenv.config({ path: path.join(envDir, '.env.local') })
}

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

const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build'
const isProd = process.env.NODE_ENV === 'production'

if (!dbConnectionString) {
  const msg = isProd
    ? '[DB_BASE] CRITICAL: DATABASE_URL is not set. Set it in Vercel dashboard → Settings → Environment Variables.'
    : '[DB_BASE] CRITICAL: DATABASE_URL is missing. Ensure DATABASE_URL is set in .env or .env.local'

  if (isBuildTime) {
    console.warn(
      '[DB_BASE] WARNING: DATABASE_URL missing during build — this is expected for static builds.'
    )
  } else if (isProd) {
    console.error(msg)
    // On Vercel production: create a lazy client that throws on first DB access
    // instead of crashing the entire process on module load. This allows
    // static/non-DB pages (like the public homepage) to render.
  } else {
    throw new Error(msg)
  }
}

if (isDev && dbConnectionString) {
  try {
    const host = new URL(dbConnectionString.replace('postgresql://', 'http://')).hostname
    const adapter = useLocalNeonAdapter ? 'neon-websocket' : 'pg'
    console.log(`[DB_BASE] Initializing ${adapter} adapter to: ${host}`)
  } catch {
    console.log('[DB_BASE] Initializing database adapter with provided string.')
  }
}

// ── Adapter factories (only called when client is created) ────────────

function createPgAdapter() {
  // Lazy import to avoid top-level crash when pg is unavailable
  const { PrismaPg } = require('@prisma/adapter-pg') as typeof import('@prisma/adapter-pg')
  const { Pool } = require('pg') as typeof import('pg')

  const pool = new Pool({
    connectionString: dbConnectionString,
    max: isDev ? 5 : 8,
    connectionTimeoutMillis: isDev ? Number(process.env.DB_CONNECT_TIMEOUT_MS ?? 10000) : 60000,
    idleTimeoutMillis: isDev ? 10000 : 30000,
    allowExitOnIdle: isDev,
  })

  pool.on('error', (err: Error) => {
    console.error('[DB_BASE] Unexpected error on idle client:', err.message)
  })

  return new PrismaPg(pool)
}

function createLocalNeonAdapter() {
  const { PrismaNeon } = require('@prisma/adapter-neon') as typeof import('@prisma/adapter-neon')
  return new PrismaNeon({ connectionString: dbConnectionString })
}

// ── Client singleton (lazy in production when URL is missing) ─────────

const globalForPrismaBase = globalThis as unknown as {
  prismaBase: PrismaClient | undefined
  _prismaBaseProxy: PrismaClient | undefined
}

let _client: PrismaClient | undefined

function getClient(): PrismaClient {
  if (_client) return _client

  // When DATABASE_URL is absent in production, return a proxy that throws
  // on any access with a clear error, rather than crashing the module.
  if (isProd && !dbConnectionString) {
    const proxy = new Proxy({} as PrismaClient, {
      get(_target, prop) {
        if (prop === '$connect' || prop === '$disconnect') {
          return async () => {}
        }
        throw new Error(
          '[DB_BASE] Database is unavailable because DATABASE_URL is not set. Configure it in Vercel dashboard → Settings → Environment Variables.'
        )
      },
    })
    _client = proxy
    return proxy
  }

  const adapter = useLocalNeonAdapter ? createLocalNeonAdapter() : createPgAdapter()

  _client = new PrismaClient({
    adapter,
    log: isDev ? ['error', 'warn'] : ['error'],
  })

  return _client
}

export const prismaBase = globalForPrismaBase.prismaBase ?? getClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrismaBase.prismaBase = prismaBase
}

export default prismaBase
