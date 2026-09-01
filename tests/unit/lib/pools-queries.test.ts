import { describe, it, expect } from 'vitest'
import { getPoolById, getActivePools, getPoolCandidates, isPoolFull, POOL_STATUS, POOL_TYPES } from '@/lib/pools/queries'

describe('lib/pools/queries', () => {
  describe('POOL_STATUS', () => {
    it('has expected status values', () => {
      expect(POOL_STATUS.OPEN).toBe('OPEN')
      expect(POOL_STATUS.FILLED).toBe('FILLED')
      expect(POOL_STATUS.CLOSED).toBe('CLOSED')
      expect(POOL_STATUS.EXPIRED).toBe('EXPIRED')
    })
  })

  describe('POOL_TYPES', () => {
    it('has expected type values', () => {
      expect(POOL_TYPES.MODULAR).toBe('MODULAR')
      expect(POOL_TYPES.EXAM_ONLY).toBe('EXAM_ONLY')
      expect(POOL_TYPES.FULL_TIME).toBe('FULL_TIME')
    })
  })

  describe('getPoolById', () => {
    it('returns pool by id', () => {
      const pool = getPoolById('pool-1')
      expect(pool).toBeDefined()
      expect(pool?.id).toBe('pool-1')
    })

    it('returns undefined for unknown id', () => {
      expect(getPoolById('unknown')).toBeUndefined()
    })
  })

  describe('getActivePools', () => {
    it('returns only open pools', () => {
      const pools = getActivePools()
      for (const pool of pools) {
        expect(pool.status).toBe('OPEN')
      }
    })

    it('returns array', () => {
      expect(Array.isArray(getActivePools())).toBe(true)
    })
  })

  describe('getPoolCandidates', () => {
    it('returns candidates array', () => {
      const candidates = getPoolCandidates('pool-1')
      expect(Array.isArray(candidates)).toBe(true)
    })

    it('returns empty array for nonexistent pool', () => {
      expect(getPoolCandidates('unknown')).toEqual([])
    })
  })

  describe('isPoolFull', () => {
    it('returns true when candidates >= max', () => {
      expect(isPoolFull('pool-1')).toBe(true)
    })

    it('returns false when candidates < max', () => {
      expect(isPoolFull('pool-spacious')).toBe(false)
    })
  })
})
