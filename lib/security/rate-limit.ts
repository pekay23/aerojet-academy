import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ---------------------------------------------------------------------------
// Redis-backed rate limiter (production) with in-memory fallback (dev/CI)
// ---------------------------------------------------------------------------

const hasRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)

const redis = hasRedis
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

// Pre-configured limiters for common auth operations
const AUTH_LIMITS = {
  login: { limit: 5, windowMs: 5 * 60 * 1000 },
  register: { limit: 3, windowMs: 60 * 60 * 1000 },
  forgotPassword: { limit: 3, windowMs: 60 * 60 * 1000 },
  resetPassword: { limit: 5, windowMs: 60 * 60 * 1000 },
  api: { limit: 100, windowMs: 60 * 1000 },
}

type AuthLimitKey = keyof typeof AUTH_LIMITS

// ---------------------------------------------------------------------------
// In-memory fallback for dev/CI (same behaviour as before, with cleanup)
// ---------------------------------------------------------------------------

const inMemoryMap = new Map<string, { count: number; resetAt: number }>()
const MAX_MAP_SIZE = 5000

function inMemoryRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = inMemoryMap.get(key)

  if (!entry || now > entry.resetAt) {
    inMemoryMap.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs }
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt }
}

// ---------------------------------------------------------------------------
// Upstash limiter cache (one Ratelimit instance per unique window config)
// ---------------------------------------------------------------------------

const limiterCache = new Map<string, Ratelimit>()

function getUpstashLimiter(limit: number, windowMs: number): Ratelimit {
  const cacheKey = `${limit}:${windowMs}`
  let limiter = limiterCache.get(cacheKey)
  if (!limiter) {
    const windowSeconds = Math.ceil(windowMs / 1000)
    const windowStr = `${windowSeconds} s` as `${number} s`
    limiter = new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(limit, windowStr),
      prefix: 'aerojet:rl',
    })
    limiterCache.set(cacheKey, limiter)
  }
  return limiter
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function rateLimitAsync(
  key: string,
  limit: number = 10,
  windowMs: number = 60000
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  if (!redis) {
    return inMemoryRateLimit(key, limit, windowMs)
  }

  const limiter = getUpstashLimiter(limit, windowMs)
  const result = await limiter.limit(key)
  return {
    allowed: result.success,
    remaining: result.remaining,
    resetAt: result.reset,
  }
}

/**
 * Synchronous rate-limit check (uses in-memory map).
 * For hot paths that can't await Redis. In production with Redis,
 * prefer `rateLimitAsync` for distributed correctness.
 */
export function rateLimit(
  key: string,
  limit: number = 10,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetAt: number } {
  return inMemoryRateLimit(key, limit, windowMs)
}

export function rateLimitAuth(action: AuthLimitKey) {
  const config = AUTH_LIMITS[action]
  return inMemoryRateLimit(`auth:${action}`, config.limit, config.windowMs)
}

export function rateLimitByIP(ip: string, limit: number = 20, windowMs: number = 60000) {
  return inMemoryRateLimit(`ip:${ip}`, limit, windowMs)
}

export function rateLimitByUser(userId: string, limit: number = 30, windowMs: number = 60000) {
  return inMemoryRateLimit(`user:${userId}`, limit, windowMs)
}

export async function rateLimitByIPAsync(ip: string, limit: number = 20, windowMs: number = 60000) {
  return rateLimitAsync(`ip:${ip}`, limit, windowMs)
}

export function getRateLimitInfo(key: string): { count: number; resetAt: number } | null {
  const entry = inMemoryMap.get(key)
  if (!entry) return null
  const now = Date.now()
  if (now > entry.resetAt) {
    inMemoryMap.delete(key)
    return null
  }
  return { count: entry.count, resetAt: entry.resetAt }
}

export function clearRateLimit(key: string): void {
  inMemoryMap.delete(key)
}

// Periodic cleanup for in-memory fallback
function cleanup() {
  const now = Date.now()
  for (const [key, entry] of inMemoryMap) {
    if (now > entry.resetAt) inMemoryMap.delete(key)
  }
  if (inMemoryMap.size > MAX_MAP_SIZE) {
    const entries = [...inMemoryMap.entries()].sort((a, b) => a[1].resetAt - b[1].resetAt)
    const toRemove = entries.slice(0, inMemoryMap.size - MAX_MAP_SIZE)
    for (const [key] of toRemove) inMemoryMap.delete(key)
  }
}

if (typeof setInterval !== 'undefined') {
  setInterval(cleanup, 60000)
}
