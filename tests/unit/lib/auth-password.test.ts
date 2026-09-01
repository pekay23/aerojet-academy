import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword, generateResetToken, isResetTokenValid } from '@/lib/auth/password'

describe('lib/auth/password', () => {
  describe('hashPassword', () => {
    it('returns string hash', async () => {
      const hash = await hashPassword('password123')
      expect(typeof hash).toBe('string')
      expect(hash.length).toBeGreaterThan(0)
    })

    it('returns different hashes for same password', async () => {
      const hash1 = await hashPassword('password123')
      const hash2 = await hashPassword('password123')
      expect(hash1).not.toBe(hash2)
    })
  })

  describe('verifyPassword', () => {
    it('returns true for correct password', async () => {
      const hash = await hashPassword('password123')
      expect(await verifyPassword(hash, 'password123')).toBe(true)
    })

    it('returns false for incorrect password', async () => {
      const hash = await hashPassword('password123')
      expect(await verifyPassword(hash, 'wrongpassword')).toBe(false)
    })
  })

  describe('generateResetToken', () => {
    it('returns string', () => {
      const token = generateResetToken()
      expect(typeof token).toBe('string')
      expect(token.length).toBeGreaterThan(0)
    })
  })

  describe('isResetTokenValid', () => {
    it('returns true for valid token', () => {
      const token = generateResetToken()
      expect(isResetTokenValid(token)).toBe(true)
    })

    it('returns false for invalid token', () => {
      expect(isResetTokenValid('invalid-token')).toBe(false)
    })

    it('returns false for null token', () => {
      expect(isResetTokenValid(null)).toBe(false)
    })
  })
})
