const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

const AUTH_LIMITS = {
  login: { limit: 5, windowMs: 5 * 60 * 1000 }, // 5 attempts per 5 minutes
  register: { limit: 3, windowMs: 60 * 60 * 1000 }, // 3 registrations per hour
  forgotPassword: { limit: 3, windowMs: 60 * 60 * 1000 }, // 3 requests per hour
  resetPassword: { limit: 5, windowMs: 60 * 60 * 1000 }, // 5 attempts per hour
  api: { limit: 100, windowMs: 60 * 1000 }, // 100 requests per minute
}

type AuthLimitKey = keyof typeof AUTH_LIMITS

export function rateLimit(
  key: string,
  limit: number = 10,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs }
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt }
}

export function rateLimitAuth(action: AuthLimitKey): {
  allowed: boolean
  remaining: number
  resetAt: number
} {
  const config = AUTH_LIMITS[action]
  return rateLimit(`auth:${action}`, config.limit, config.windowMs)
}

export function rateLimitByIP(ip: string, limit: number = 20, windowMs: number = 60000) {
  return rateLimit(`ip:${ip}`, limit, windowMs)
}

export function rateLimitByUser(userId: string, limit: number = 30, windowMs: number = 60000) {
  return rateLimit(`user:${userId}`, limit, windowMs)
}

export function getRateLimitInfo(key: string): { count: number; resetAt: number } | null {
  const entry = rateLimitMap.get(key)
  if (!entry) return null
  const now = Date.now()
  if (now > entry.resetAt) {
    rateLimitMap.delete(key)
    return null
  }
  return { count: entry.count, resetAt: entry.resetAt }
}

export function clearRateLimit(key: string): void {
  rateLimitMap.delete(key)
}

const MAX_MAP_SIZE = 5000

function cleanup() {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key)
  }
  // If still over limit after cleanup, evict oldest entries
  if (rateLimitMap.size > MAX_MAP_SIZE) {
    const entries = [...rateLimitMap.entries()].sort((a, b) => a[1].resetAt - b[1].resetAt)
    const toRemove = entries.slice(0, rateLimitMap.size - MAX_MAP_SIZE)
    for (const [key] of toRemove) rateLimitMap.delete(key)
  }
}

if (typeof setInterval !== 'undefined') {
  setInterval(cleanup, 60000)
}
