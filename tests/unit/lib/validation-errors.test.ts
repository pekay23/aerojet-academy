import { describe, it, expect } from 'vitest'
import { formatValidationError, getValidationErrors, hasValidationErrors, VALIDATION_ERROR_TYPES, VALIDATION_ERROR_MESSAGES } from '@/lib/validation/errors'

describe('lib/validation/errors', () => {
  describe('VALIDATION_ERROR_TYPES', () => {
    it('has expected types', () => {
      expect(VALIDATION_ERROR_TYPES.REQUIRED).toBeDefined()
      expect(VALIDATION_ERROR_TYPES.INVALID_EMAIL).toBeDefined()
      expect(VALIDATION_ERROR_TYPES.MIN_LENGTH).toBeDefined()
      expect(VALIDATION_ERROR_TYPES.MAX_LENGTH).toBeDefined()
    })
  })

  describe('VALIDATION_ERROR_MESSAGES', () => {
    it('has message for each type', () => {
      for (const [type, message] of Object.entries(VALIDATION_ERROR_MESSAGES)) {
        expect(message).toBeDefined()
        expect(typeof message).toBe('string')
      }
    })
  })

  describe('formatValidationError', () => {
    it('returns formatted error string', () => {
      const error = formatValidationError('REQUIRED', 'email')
      expect(typeof error).toBe('string')
    })

    it('includes field name', () => {
      const error = formatValidationError('REQUIRED', 'email')
      expect(error).toContain('email')
    })

    it('includes error type message', () => {
      const error = formatValidationError('REQUIRED', 'email')
      expect(error).toContain(VALIDATION_ERROR_MESSAGES.REQUIRED)
    })
  })

  describe('getValidationErrors', () => {
    it('returns errors for invalid data', () => {
      const errors = getValidationErrors({ email: '', name: 'John' })
      expect(Array.isArray(errors)).toBe(true)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('returns empty array for valid data', () => {
      const errors = getValidationErrors({ email: 'test@example.com', name: 'John' })
      expect(errors).toEqual([])
    })
  })

  describe('hasValidationErrors', () => {
    it('returns true when errors exist', () => {
      expect(hasValidationErrors([{ field: 'email', type: 'REQUIRED' }])).toBe(true)
    })

    it('returns false when no errors', () => {
      expect(hasValidationErrors([])).toBe(false)
    })
  })
})
