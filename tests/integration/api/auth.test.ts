import { describe, it, expect, vi } from 'vitest'
import { isValidEmail } from '@/lib/utils/validation'

describe('Auth Integration', () => {
  it('validates email format', () => {
    expect(isValidEmail('test@example.com')).toBe(true)
    expect(isValidEmail('invalid')).toBe(false)
    expect(isValidEmail('admin@aerojet-academy.com')).toBe(true)
  })

  it('validates strong password requirements', () => {
    const { isStrongPassword } = require('@/lib/utils/validation')
    expect(isStrongPassword('Admin@2026').valid).toBe(true)
    expect(isStrongPassword('weak').valid).toBe(false)
    expect(isStrongPassword('nouppercase1').valid).toBe(false)
  })
})
