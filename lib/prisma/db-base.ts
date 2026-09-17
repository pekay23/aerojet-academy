// ═══════════════════════════════════════════════════════════════════════════
// ⚠️  CRITICAL: DO NOT MODIFY THIS FILE WITHOUT READING THE COMMENT BELOW  ⚠️
// ═══════════════════════════════════════════════════════════════════════════
//
// 📌 HISTORICAL LESSONS (2026-07-24):
//
// ❌ PROBLEM 1: .env.production file loading
//    Old code used `dotenv.config({ path: '.env.production' })` to load env
//    vars at runtime on Vercel. This was unreliable because the filesystem
//    on serverless functions is NOT guaranteed to have this file.
//    RESULT: DATABASE_URL silently missing → Prisma 7 defaulted to
//    localhost:5432 → "Can't reach database server at 127.0.0.1:5432" error.
//
// ✅ FIX: Never load env files at runtime on Vercel. Set DATABASE_URL
//    in Vercel Dashboard → Settings → Environment Variables. The
//    getDatabaseUrl() function throws IMMEDIATELY if DATABASE_URL is
//    missing — no silent fallbacks.
//
// ❌ PROBLEM 2: Fallback chain (LOCAL_DATABASE_URL || DATABASE_URL || DIRECT_URL)
//    with different priority order in db-base.ts vs prisma.config.ts
//    (opposite order). This created confusion about which URL was actually used.
//
// ✅ FIX: Single source of truth — DATABASE_URL is always the connection
//    string. DIRECT_URL is only used for Prisma migrations. LOCAL_DATABASE_URL
//    is only used in development.
//
// ❌ PROBLEM 3: Build-time proxy stub threw on $extends()
//    The stub only allowed $connect, $disconnect, then. But client.ts calls
//    prismaBase.$extends(softDeleteExtension()) during module evaluation.
//    RESULT: Build failed with "[DB_BASE] Prisma queries are not available
//    during build time."
//
// ✅ FIX: Recursive proxy stub that allows ANY property access during
//    module evaluation. Only throws when a query method is actually
//    called with arguments (findMany, create, etc.).
//
// ❌ PROBLEM 4: Secrets committed to git
//    .env, .env.production, .env.staging all contained live credentials
//    (Resend API key, Google OAuth secrets, UploadThing secret).
//    .gitignore had a fragile pattern that was supposed to exclude them
//    but they remained tracked.
//
// ✅ FIX: .gitignore now uses a simple `.env*` pattern with only
//    `.env.example` allowed. Removed from git tracking with `git rm --cached`.
//
// ❌ PROBLEM 5: server-only vars exposed in env.ts
//    lib/env.ts had no import 'server-only', meaning it could theoretically
//    be imported from client components.
//
// ✅ FIX: Added `import 'server-only'` to lib/env.ts and lib/prisma/*.ts
//    files. Next.js will throw a build error if any client component
//    tries to import them.
//
// 🔒 RULES FOR FUTURE MODIFICATIONS:
//    1. NEVER load .env files from disk at runtime — Vercel injects env vars natively
//    2. NEVER add silent fallbacks for DATABASE_URL — fail fast
//    3. NEVER use opposite URL priority order — keep DATABASE_URL as primary
//    4. If modifying the build-time stub, test that $extends() chaining works
//    5. NEVER commit .env.* files with secrets to git
//    6. ALWAYS add `import 'server-only'` to any file that reads server secrets
// ═══════════════════════════════════════════════════════════════════════════

import 'server-only'
import { createRequire } from 'module'
import { PrismaClient } from '@prisma/client'

const require = createRequire(import.meta.url)

/**
 * DATABASE BASE LAYER (Raw Client)
 *
 * === RUNTIME BEHAVIOR ===
 * - If DATABASE_URL is missing, throws immediately with clear instructions
 * - During Next.js build (NEXT_PHASE=phase-production-build), returns a stub
 *   that allows module evaluation but throws if any query is attempted
 * - During development, uses DATABASE_URL from .env or LOCAL_DATABASE_URL
 * - During production (Vercel), uses DATABASE_URL from Vercel env vars
 *
 * === ADAPTER SELECTION ===
 * - If connection string hostname ends with .neon.tech → uses @prisma/adapter-neon (WebSocket)
 *   BUT in development mode, the pg TCP adapter is used instead for stability on local
 *   Windows/macOS environments (Neon pooler URLs work with standard TCP connections)
 * - Otherwise → uses @prisma/adapter-pg with pg Pool
 *
 * === CONNECTION POOL ===
 * - Max connections: 8
 * - Connection timeout: 10s (configurable via DB_CONNECT_TIMEOUT_MS)
 * - Idle timeout: 30s
 */

// ── Database URL resolution ──

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL

  if (!url) {
    if (process.env.VERCEL) {
      console.error(
        '[DB_BASE] ❌ DATABASE_URL is not set. ' +
          'Go to Vercel dashboard → Settings → Environment Variables and add DATABASE_URL.'
      )
    }
    throw new Error(
      '[DB_BASE] DATABASE_URL environment variable is required. ' +
        'Set it in your .env file locally, or in the Vercel dashboard for production.'
    )
  }

  return url
}

// ── Adapter factory ──

function isNeonConnection(connectionString: string): boolean {
  try {
    return new URL(connectionString.replace(/^postgres(ql)?:\/\//, 'https://')).hostname.endsWith(
      '.neon.tech'
    )
  } catch {
    return false
  }
}

function createAdapter(connectionString: string) {
  const isNeon = isNeonConnection(connectionString)
  const isDev = process.env.NODE_ENV === 'development'
  const timeout = Number(process.env.DB_CONNECT_TIMEOUT_MS) || 30_000

  // In development, prefer the TCP-based pg adapter over the Neon WebSocket
  // adapter for more stable connections on local Windows/macOS environments.
  // The Neon pooler URL works perfectly with standard pg TCP connections,
  // avoiding the WebSocket instability that causes "prisma:error undefined".
  if (isNeon && !isDev) {
    const { PrismaNeon } = require('@prisma/adapter-neon')
    return new PrismaNeon({ connectionString })
  }

  const { PrismaPg } = require('@prisma/adapter-pg')
  const { Pool } = require('pg')

  const pool = new Pool({
    connectionString,
    max: isDev ? 16 : 8,
    connectionTimeoutMillis: timeout,
    idleTimeoutMillis: 30_000,
    ssl: isDev ? { rejectUnauthorized: false } : undefined,
  })

  // Log full error objects, not just .message (which can be undefined)
  pool.on('error', (err: Error) => {
    if (err instanceof Error) {
      console.error('[DB_BASE] Unexpected error on idle client:', err.stack || err.message)
    } else {
      console.error('[DB_BASE] Unexpected error on idle client (non-Error):', JSON.stringify(err))
    }
  })

  return new PrismaPg(pool)
}

// ── Build-time stub ──

/**
 * ⚠️ BUILD-TIME STUB — read before modifying ⚠️
 *
 * Creates a recursive Proxy that acts as a PrismaClient during Next.js builds.
 * This is necessary because Next.js evaluates all imported modules during the
 * build phase, and PrismaClient requires a live database connection.
 *
 * BEHAVIOR:
 * - Allows ANY property access (model names, nested fields, $methods)
 * - Handles $extends() by returning itself (needed by client.ts's createExtendedClient)
 * - Handles $connect() / $disconnect() / $use() / $on() as no-ops
 * - Handles $transaction() by executing callbacks or returning the batch
 * - THROWS if any Prisma query method (findMany, create, update, etc.) is called
 *
 * If a new $method is added to PrismaClient that gets called during module
 * evaluation, add it to the allowlist below. If the build fails with
 * "[DB_BASE] Prisma queries are not available during build time", the stub
 * is not handling a property that's being accessed during evaluation.
 */
function createBuildTimeStub(): PrismaClient {
  const ERR_MSG =
    '[DB_BASE] Prisma queries are not available during build time. DATABASE_URL must be set for runtime.'

  const throwOnQuery = () => {
    throw new Error(ERR_MSG)
  }

  /**
   * Recursive ProxyHandler that intercepts property access and function calls.
   *
   * Property access (e.g., prisma.user, prisma.$extends) → returns a stub function
   * Function call (e.g., stub()) → routes to the handler below based on the prop name
   */
  const createModelHandler = (): ProxyHandler<object> => ({
    get(_target, prop, _receiver) {
      // Allow `then` so stub isn't treated as a thenable/promise
      if (prop === 'then') return undefined
      // Allow symbols (iterator, toPrimitive, etc.)
      if (typeof prop === 'symbol') return undefined
      // Allow constructor/prototype introspection
      if (prop === 'constructor' || prop === '__proto__' || prop === 'prototype') return undefined
      // Allow JSON serialization and string coercion
      if (prop === 'toJSON' || prop === 'toString' || prop === 'valueOf')
        return () => '[PrismaClient Build Stub]'

      // Return a stub function that, when called, handles known $methods
      // or throws for actual Prisma queries
      const fn = (...args: unknown[]) => {
        // $extends() — return the stub itself for chaining (used in client.ts)
        if (prop === '$extends') return buildStub
        // $connect() / $disconnect() — no-ops during build
        if (prop === '$connect' || prop === '$disconnect') return
        // $use() / $on() — middleware/event setup, no-op during build
        if (prop === '$use' || prop === '$on') return buildStub
        // $transaction() — allow callbacks to execute for module evaluation
        if (prop === '$transaction') {
          if (args.length === 1 && typeof args[0] === 'function') {
            return args[0](buildStub)
          }
          return Promise.resolve(args)
        }
        // Any actual Prisma query method → throw
        throwOnQuery()
      }

      // Wrap the function in another proxy so that accessing properties
      // on it (e.g., stub.findMany) returns the function itself, allowing
      // chaining (e.g., prisma.user.findMany → get 'user' → get 'findMany' → call → throw)
      return new Proxy(fn, {
        apply(target, _thisArg, args) {
          return target(...args)
        },
        get(target, p) {
          if (p === 'then') return undefined
          if (typeof p === 'symbol') return undefined
          return target
        },
      })
    },

    apply(_target, _thisArg, _args) {
      throwOnQuery()
    },
  })

  const buildStub = new Proxy({}, createModelHandler()) as unknown as PrismaClient
  return buildStub
}

// ── Client singleton ──

const globalForPrismaBase = globalThis as unknown as {
  prismaBase: PrismaClient | undefined
}

function getClient(): PrismaClient {
  const connectionString = getDatabaseUrl()
  const adapter = createAdapter(connectionString)
  const isDev = process.env.NODE_ENV === 'development'

  const client = new PrismaClient({
    adapter,
    log: isDev ? ['error', 'warn'] : ['error'],
  })

  // Improve Prisma error logging: Prisma's default "prisma:error undefined"
  // output is unhelpful when the error object lacks a .message property.
  // This handler logs the full error context for diagnostics.
  client.$on('error', (e: any) => {
    const msg = e?.message ?? '[No message in Prisma error event]'
    const code = e?.code ? ` (code: ${e.code})` : ''
    const target = e?.target ? ` (model: ${e.target})` : ''
    const meta = e?.meta ? ` meta: ${JSON.stringify(e.meta)}` : ''
    console.error(`[DB_BASE] Prisma error:${code}${target} ${msg}${meta}`)
  })

  return client
}

let _client: PrismaClient | undefined

function getOrCreateClient(): PrismaClient {
  // During build time, return a stub that allows module evaluation
  // but throws on actual query invocation
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    if (!_client) {
      _client = createBuildTimeStub()
    }
    return _client
  }

  return getClient()
}

export const prismaBase = globalForPrismaBase.prismaBase ?? getOrCreateClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrismaBase.prismaBase = prismaBase
}

export default prismaBase
