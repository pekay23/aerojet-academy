import { describe, it, expect } from 'vitest'
import { getValidationSchema, validateField, getFieldError, VALIDATION_RULES } from '@/lib/validation/schema'

describe('lib/validation/schema', () => {
  describe('VALIDATION_RULES', () => {
    it('has expected rules', () => {
      expect(VALIDATION_RULES.REQUIRED).toBeDefined()
      expect(VALIDATION_RULES.EMAIL).toBeDefined()
      expect(VALIDATION_RULES.MIN_LENGTH).toBeDefined()
      expect(VALIDATION_RULES.MAX_LENGTH).toBeDefined()
    })

    it('each rule has message', () => {
      for (const [key, rule] of Object.entries(VALIDATION_RULES)) {
        expect(rule.message).toBeDefined()
        expect(typeof rule.message).toBe('string')
      }
    })
  })

  describe('getValidationSchema', () => {
    it('returns schema for form type', () => {
      const schema = getValidationSchema('login')
      expect(schema).toBeDefined()
      expect(typeof schema).toBe('object')
    })

    it('returns empty schema for unknown form', () => {
      const schema = getValidationSchema('unknown')
      expect(schema).toBeDefined()
    })
  })

  describe('validateField', () => {
    it('returns valid for required field with value', () => {
      const result = validateField('email', 'test@example.com', { required: true, email: true })
      expect(result.valid).toBe(true)
    })

    it('returns invalid for required field without value', () => {
      const result = validateField('email', '', { required: true })
      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('returns invalid for invalid email', () => {
      const result = validateField('email', 'invalid', { email: true })
      expect(result.valid).toBe(false)
    })
  })

  describe('getFieldError', () => {
    it('returns error message', () => {
      expect(getFieldError('required')).toBeDefined()
    })

    it('returns error for email rule', () => {
      expect(getFieldError('email')).toBeDefined()
    })
  })
})
