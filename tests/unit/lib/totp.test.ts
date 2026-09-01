import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateSecret, generateCode, verifyTOTP, base32Decode } from '@/lib/auth/totp'

describe('lib/auth/totp', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  // ---------------------------------------------------------------------------
  // base32Decode
  // ---------------------------------------------------------------------------

  describe('base32Decode', () => {
    it('decodes a valid base32 string', () => {
      const result = base32Decode('JBSWY3DPEHPK3PXP')
      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBeGreaterThan(0)
    })

    it('strips padding and whitespace before decoding', () => {
      const result = base32Decode('JBSWY3DPEHPK3PXP  ===')
      expect(result.length).toBeGreaterThan(0)
    })

    it('is case-insensitive', () => {
      const upper = base32Decode('JBSWY3DPEHPK3PXP')
      const lower = base32Decode('jbswy3dpehpk3pxp')
      expect(lower).toEqual(upper)
    })

    it('returns empty buffer for empty string', () => {
      const result = base32Decode('')
      expect(result.length).toBe(0)
    })

    it('ignores invalid characters', () => {
      const result = base32Decode('JBSWY3DPEHPK3PXP!@#')
      expect(result.length).toBeGreaterThan(0)
    })
  })

  // ---------------------------------------------------------------------------
  // generateCode
  // ---------------------------------------------------------------------------

  describe('generateCode', () => {
    it('returns a 6-digit string', () => {
      const secret = generateSecret()
      const code = generateCode(secret, 0)
      expect(code).toHaveLength(6)
      expect(/^\d{6}$/.test(code)).toBe(true)
    })

    it('produces consistent codes for the same counter', () => {
      const secret = generateSecret()
      const code1 = generateCode(secret, 1000)
      const code2 = generateCode(secret, 1000)
      expect(code1).toBe(code2)
    })

    it('produces different codes for different counters', () => {
      const secret = generateSecret()
      const code1 = generateCode(secret, 1000)
      const code2 = generateCode(secret, 1001)
      expect(code1).not.toBe(code2)
    })

    it('produces different codes for different secrets', () => {
      const secret1 = generateSecret()
      const secret2 = generateSecret()
      const code1 = generateCode(secret1, 1000)
      const code2 = generateCode(secret2, 1000)
      expect(code1).not.toBe(code2)
    })
  })

  // ---------------------------------------------------------------------------
  // generateSecret
  // ---------------------------------------------------------------------------

  describe('generateSecret', () => {
    it('returns a base32-encoded string', () => {
      const secret = generateSecret()
      expect(/^[A-Z2-7]+=*$/.test(secret)).toBe(true)
    })

    it('defaults to 20 bytes', () => {
      const secret = generateSecret()
      // 20 bytes = 160 bits = 32 base32 chars
      expect(secret.replace(/=/g, '').length).toBe(32)
    })

    it('supports custom byte lengths', () => {
      const secret10 = generateSecret(10)
      const secret30 = generateSecret(30)
      expect(secret10.replace(/=/g, '').length).not.toBe(secret30.replace(/=/g, '').length)
    })

    it('produces unique secrets on each call', () => {
      const secret1 = generateSecret()
      const secret2 = generateSecret()
      expect(secret1).not.toBe(secret2)
    })
  })

  // ---------------------------------------------------------------------------
  // verifyTOTP
  // ---------------------------------------------------------------------------

  describe('verifyTOTP', () => {
    it('verifies a freshly generated code within the window', () => {
      const secret = generateSecret()
      const code = generateCode(secret, Math.floor(Date.now() / 1000 / 30))
      const result = verifyTOTP(code, secret)
      expect(result).not.toBe(false)
      expect(typeof result).toBe('number')
    })

    it('returns false for an invalid code', () => {
      const secret = generateSecret()
      const result = verifyTOTP('000000', secret)
      expect(result).toBe(false)
    })

    it('returns false for an empty token', () => {
      const secret = generateSecret()
      const result = verifyTOTP('', secret)
      expect(result).toBe(false)
    })

    it('rejects expired codes outside the window', () => {
      const secret = generateSecret()
      const now = Math.floor(Date.now() / 1000 / 30)
      const code = generateCode(secret, now - 10) // 10 steps ago = 5 minutes

      vi.useFakeTimers()
      vi.setSystemTime(Date.now() + 10 * 30 * 1000) // advance past window

      const result = verifyTOTP(code, secret, 1)
      expect(result).toBe(false)

      vi.useRealTimers()
    })

    it('accepts codes within the ±window', () => {
      const secret = generateSecret()
      const now = Math.floor(Date.now() / 1000 / 30)
      const prevCode = generateCode(secret, now - 1)
      const currCode = generateCode(secret, now)
      const nextCode = generateCode(secret, now + 1)

      // All three should verify with window=1
      expect(verifyTOTP(prevCode, secret, 1)).not.toBe(false)
      expect(verifyTOTP(currCode, secret, 1)).not.toBe(false)
      expect(verifyTOTP(nextCode, secret, 1)).not.toBe(false)
    })

    it('enforces replay protection with lastUsedCounter', () => {
      const secret = generateSecret()
      const now = Math.floor(Date.now() / 1000 / 30)
      const code = generateCode(secret, now)

      // First verification succeeds
      const firstResult = verifyTOTP(code, secret, 1)
      expect(firstResult).not.toBe(false)

      // Replay with lastUsedCounter should fail
      const replayResult = verifyTOTP(code, secret, 1, firstResult as number)
      expect(replayResult).toBe(false)
    })

    it('returns the matching counter value for replay protection', () => {
      const secret = generateSecret()
      const now = Math.floor(Date.now() / 1000 / 30)
      const code = generateCode(secret, now)

      const result = verifyTOTP(code, secret, 1)
      expect(result).toBe(now)
    })

    it('supports custom window sizes', () => {
      const secret = generateSecret()
      const now = Math.floor(Date.now() / 1000 / 30)
      const oldCode = generateCode(secret, now - 3)

      // With window=1, should fail
      expect(verifyTOTP(oldCode, secret, 1)).toBe(false)

      // With window=3, should succeed
      expect(verifyTOTP(oldCode, secret, 3)).not.toBe(false)
    })
  })
})
