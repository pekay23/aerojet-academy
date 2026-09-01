import { describe, it, expect } from 'vitest'
import { seedDefaultRetentionPolicies, runRetentionSweep } from '@/lib/gdpr/retention'

describe('lib/gdpr/retention', () => {
  describe('seedDefaultRetentionPolicies', () => {
    it('is a function', () => {
      expect(typeof seedDefaultRetentionPolicies).toBe('function')
    })
  })

  describe('runRetentionSweep', () => {
    it('is a function', () => {
      expect(typeof runRetentionSweep).toBe('function')
    })
  })
})
