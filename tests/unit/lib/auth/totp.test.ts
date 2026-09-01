import { describe, it, expect, vi, beforeEach } from 'vitest'
import { verifyTOTP, base32Decode, generateSecret, generateCode } from '@/lib/auth/totp'

describe('base32Decode', () => {
  it('decodes valid base32 strings', () => {
    expect(base32Decode('NBSWY3DP').toString()).toBe('hello')
  })

  it('strips padding characters', () => {
    expect(base32Decode('NBSWY3DP====').toString()).toBe('hello')
  })

  it('handles lowercase input', () => {
    expect(base32Decode('nbswy3dp').toString()).toBe('hello')
  })

  it('ignores whitespace', () => {
    expect(base32Decode('NBSWY 3DP').toString()).toBe('hello')
  })

  it('ignores invalid characters', () => {
    expect(base32Decode('NBSWY3DP!@#').toString()).toBe('hello')
  })

  it('returns empty buffer for empty string', () => {
    expect(base32Decode('').length).toBe(0)
  })

  it('throws on null input', () => {
    expect(() => base32Decode(null as any)).toThrow()
  })

  it('throws on undefined input', () => {
    expect(() => base32Decode(undefined as any)).toThrow()
  })
})

describe('generateSecret', () => {
  it('returns a base32 string of default length', () => {
    const secret = generateSecret()
    expect(secret.length).toBeGreaterThan(0)
    expect(secret).toMatch(/^[A-Z2-7]+$/)
  })

  it('returns a base32 string of specified byte length', () => {
    const secret = generateSecret(32)
    expect(secret.length).toBeGreaterThan(0)
    expect(secret).toMatch(/^[A-Z2-7]+$/)
  })

  it('generates different secrets on successive calls', () => {
    expect(generateSecret()).not.toBe(generateSecret())
  })
})

describe('verifyTOTP', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns counter for valid token', () => {
    const secret = generateSecret()
    const counter = 12345
    const token = generateCode(secret, counter)

    vi.spyOn(Date, 'now').mockReturnValue(counter * 30 * 1000)

    expect(verifyTOTP(token, secret)).toBe(counter)
  })

  it('returns false for invalid token', () => {
    const secret = generateSecret()
    const counter = 12345

    vi.spyOn(Date, 'now').mockReturnValue(counter * 30 * 1000)

    expect(verifyTOTP('000000', secret)).toBe(false)
  })

  it('accepts tokens within window', () => {
    const secret = generateSecret()
    const counter = 12345
    const token = generateCode(secret, counter)

    vi.spyOn(Date, 'now').mockReturnValue((counter + 2) * 30 * 1000)

    expect(verifyTOTP(token, secret, 2)).toBe(counter)
  })

  it('rejects tokens outside window', () => {
    const secret = generateSecret()
    const counter = 12345
    const token = generateCode(secret, counter)

    vi.spyOn(Date, 'now').mockReturnValue((counter + 3) * 30 * 1000)

    expect(verifyTOTP(token, secret, 1)).toBe(false)
  })

  it('enforces replay protection with lastUsedCounter', () => {
    const secret = generateSecret()
    const counter = 12345
    const token = generateCode(secret, counter)

    vi.spyOn(Date, 'now').mockReturnValue((counter + 1) * 30 * 1000)

    expect(verifyTOTP(token, secret, 1)).toBe(counter)
    expect(verifyTOTP(token, secret, 1, counter)).toBe(false)
  })

  it('allows newer token after replay-protected one', () => {
    const secret = generateSecret()
    const counter = 12345
    const token = generateCode(secret, counter)

    vi.spyOn(Date, 'now').mockReturnValue((counter + 1) * 30 * 1000)

    expect(verifyTOTP(token, secret, 1)).toBe(counter)

    const nextCounter = counter + 1
    const nextToken = generateCode(secret, nextCounter)
    expect(verifyTOTP(nextToken, secret, 1, counter)).toBe(nextCounter)
  })

  it('handles empty secret', () => {
    expect(verifyTOTP('123456', '')).toBe(false)
  })

  it('throws on null secret', () => {
    expect(() => verifyTOTP('123456', null as any)).toThrow()
  })

  it('throws on undefined secret', () => {
    expect(() => verifyTOTP('123456', undefined as any)).toThrow()
  })

  it('throws on wrong-length token', () => {
    const secret = generateSecret()
    expect(() => verifyTOTP('', secret)).toThrow()
    expect(() => verifyTOTP('12345', secret)).toThrow()
    expect(() => verifyTOTP('1234567', secret)).toThrow()
  })
})
