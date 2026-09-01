import { describe, it, expect } from 'vitest'
import { hashText, verifyHash, generateSalt, compareHashes, HASH_ALGORITHM } from '@/lib/security/hash'

describe('lib/security/hash', () => {
  describe('HASH_ALGORITHM', () => {
    it('is a string', () => {
      expect(typeof HASH_ALGORITHM).toBe('string')
    })

    it('has length greater than 0', () => {
      expect(HASH_ALGORITHM.length).toBeGreaterThan(0)
    })
  })

  describe('hashText', () => {
    it('returns string hash', async () => {
      const hash = await hashText('test text')
      expect(typeof hash).toBe('string')
      expect(hash.length).toBeGreaterThan(0)
    })

    it('returns deterministic hash for same input', async () => {
      const hash1 = await hashText('test text')
      const hash2 = await hashText('test text')
      expect(hash1).toBe(hash2)
    })

    it('returns different hashes for different inputs', async () => {
      const hash1 = await hashText('text one')
      const hash2 = await hashText('text two')
      expect(hash1).not.toBe(hash2)
    })
  })

  describe('verifyHash', () => {
    it('returns true for matching text', async () => {
      const hash = await hashText('secret')
      expect(await verifyHash(hash, 'secret')).toBe(true)
    })

    it('returns false for non-matching text', async () => {
      const hash = await hashText('secret')
      expect(await verifyHash(hash, 'wrong')).toBe(false)
    })
  })

  describe('generateSalt', () => {
    it('returns string', () => {
      expect(typeof generateSalt()).toBe('string')
    })

    it('returns unique salts', () => {
      const salt1 = generateSalt()
      const salt2 = generateSalt()
      expect(salt1).not.toBe(salt2)
    })
  })

  describe('compareHashes', () => {
    it('returns true for equal hashes', () => {
      expect(compareHashes('abc123', 'abc123')).toBe(true)
    })

    it('returns false for different hashes', () => {
      expect(compareHashes('abc123', 'def456')).toBe(false)
    })
  })
})
