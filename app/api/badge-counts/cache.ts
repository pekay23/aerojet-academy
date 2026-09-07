interface CacheEntry<T> {
  data: T
  timestamp: Date
}

export class BadgeCountsCache {
  private static instance: BadgeCountsCache
  private globalCache: Map<string, CacheEntry<unknown>> = new Map()
  private userCache: Map<string, CacheEntry<unknown>> = new Map()
  private readonly GLOBAL_TTL = 60 * 1000 // 60 seconds
  private readonly USER_TTL = 45 * 1000 // 45 seconds

  private constructor() {}

  public static getInstance(): BadgeCountsCache {
    if (!BadgeCountsCache.instance) {
      BadgeCountsCache.instance = new BadgeCountsCache()
    }
    return BadgeCountsCache.instance
  }

  getGlobal<T = unknown>(key: string): T | null {
    const entry = this.globalCache.get(key)
    if (!entry) return null
    if (Date.now() - entry.timestamp.getTime() > this.GLOBAL_TTL) {
      this.globalCache.delete(key)
      return null
    }
    return entry.data as T
  }

  setGlobal(key: string, data: unknown) {
    this.globalCache.set(key, { data, timestamp: new Date() })
  }

  getUser<T = unknown>(userId: string, key: string): T | null {
    const compositeKey = `${userId}:${key}`
    const entry = this.userCache.get(compositeKey)
    if (!entry) return null
    if (Date.now() - entry.timestamp.getTime() > this.USER_TTL) {
      this.userCache.delete(compositeKey)
      return null
    }
    return entry.data as T
  }

  setUser(userId: string, key: string, data: unknown) {
    const compositeKey = `${userId}:${key}`
    this.userCache.set(compositeKey, { data, timestamp: new Date() })
  }

  invalidateUser(userId: string) {
    // Clear all keys starting with userId:
    for (const key of this.userCache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        this.userCache.delete(key)
      }
    }
  }

  invalidateGlobal() {
    this.globalCache.clear()
  }
}

export const badgeCountsCache = BadgeCountsCache.getInstance()
