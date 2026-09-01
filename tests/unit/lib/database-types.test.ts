import { describe, it, expect } from 'vitest'
import { getDatabaseType, validateConnection, getConnectionStatus, DATABASE_TYPES, DATABASE_STATUS } from '@/lib/database/types'

describe('lib/database/types', () => {
  describe('DATABASE_TYPES', () => {
    it('has expected types', () => {
      expect(DATABASE_TYPES.NEON).toBeDefined()
      expect(DATABASE_TYPES.SUPABASE).toBeDefined()
      expect(DATABASE_TYPES.LOCAL).toBeDefined()
    })
  })

  describe('DATABASE_STATUS', () => {
    it('has expected status values', () => {
      expect(DATABASE_STATUS.CONNECTED).toBe('CONNECTED')
      expect(DATABASE_STATUS.DISCONNECTED).toBe('DISCONNECTED')
      expect(DATABASE_STATUS.ERROR).toBe('ERROR')
    })
  })

  describe('getDatabaseType', () => {
    it('returns type by code', () => {
      expect(getDatabaseType('NEON')).toBeDefined()
    })

    it('returns undefined for unknown code', () => {
      expect(getDatabaseType('UNKNOWN')).toBeUndefined()
    })
  })

  describe('validateConnection', () => {
    it('returns valid for valid connection string', () => {
      const result = validateConnection('postgresql://user:pass@host:5432/db')
      expect(result.valid).toBe(true)
    })

    it('returns invalid for empty string', () => {
      const result = validateConnection('')
      expect(result.valid).toBe(false)
    })

    it('returns invalid for null', () => {
      const result = validateConnection(null)
      expect(result.valid).toBe(false)
    })
  })

  describe('getConnectionStatus', () => {
    it('returns CONNECTED for working connection', () => {
      expect(getConnectionStatus('postgresql://user:pass@host:5432/db')).toBe('CONNECTED')
    })

    it('returns ERROR for invalid connection', () => {
      expect(getConnectionStatus('invalid')).toBe('ERROR')
    })
  })
})
