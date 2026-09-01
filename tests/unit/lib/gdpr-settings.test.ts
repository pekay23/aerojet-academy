import { describe, it, expect } from 'vitest'
import { getRetentionPolicy, updateRetentionPolicy, getRetentionPolicies, RETENTION_POLICY_TYPES, DEFAULT_RETENTION_DAYS } from '@/lib/gdpr/settings'

describe('lib/gdpr/settings', () => {
  describe('RETENTION_POLICY_TYPES', () => {
    it('has expected policy types', () => {
      expect(RETENTION_POLICY_TYPES.USER_DATA).toBeDefined()
      expect(RETENTION_POLICY_TYPES.FINANCIAL).toBeDefined()
      expect(RETENTION_POLICY_TYPES.COMMUNICATION).toBeDefined()
    })
  })

  describe('DEFAULT_RETENTION_DAYS', () => {
    it('has default days for each type', () => {
      expect(DEFAULT_RETENTION_DAYS.USER_DATA).toBeGreaterThan(0)
      expect(DEFAULT_RETENTION_DAYS.FINANCIAL).toBeGreaterThan(0)
      expect(DEFAULT_RETENTION_DAYS.COMMUNICATION).toBeGreaterThan(0)
    })
  })

  describe('getRetentionPolicy', () => {
    it('returns policy by type', () => {
      expect(getRetentionPolicy('USER_DATA')).toBeDefined()
    })

    it('returns undefined for unknown type', () => {
      expect(getRetentionPolicy('UNKNOWN')).toBeUndefined()
    })
  })

  describe('updateRetentionPolicy', () => {
    it('returns updated policy', () => {
      const updated = updateRetentionPolicy('USER_DATA', 3650)
      expect(updated.retentionDays).toBe(3650)
    })
  })

  describe('getRetentionPolicies', () => {
    it('returns all policies', () => {
      const policies = getRetentionPolicies()
      expect(Array.isArray(policies)).toBe(true)
      expect(policies.length).toBeGreaterThan(0)
    })
  })
})
