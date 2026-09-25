import 'server-only'
import { PrismaClient } from '@prisma/client'

/**
 * Shared build-time PrismaClient stub factory.
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
 * @param moduleLabel - Label used in error messages (e.g., 'DB_BASE', 'HEARTBEAT')
 * @returns A PrismaClient stub for build-time module evaluation
 */
export function createBuildTimeStub(moduleLabel: string): PrismaClient {
  const ERR_MSG = `[${moduleLabel}] Prisma queries are not available during build time. DATABASE_URL must be set for runtime.`

  const throwOnQuery = () => {
    throw new Error(ERR_MSG)
  }

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
        return () => `[PrismaClient Build Stub]`

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
