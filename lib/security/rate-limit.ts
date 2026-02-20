const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(key: string, limit: number = 10, windowMs: number = 60000): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1 }
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 }
  }

  entry.count++
  return { allowed: true, remaining: limit - entry.count }
}

export function rateLimitByIP(ip: string, limit: number = 20, windowMs: number = 60000) {
  return rateLimit(`ip:${ip}`, limit, windowMs)
}

export function rateLimitByUser(userId: string, limit: number = 30, windowMs: number = 60000) {
  return rateLimit(`user:${userId}`, limit, windowMs)
}

// Cleanup stale entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key)
  }
}, 300000) // Every 5 minutes
