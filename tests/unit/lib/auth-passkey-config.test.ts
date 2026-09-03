import { describe, it, expect } from 'vitest'
import { rpConfig } from '@/lib/auth/passkey-config'

describe('lib/auth/passkey-config', () => {
  describe('rpConfig', () => {
    it('has rpName', () => {
      expect(rpConfig.rpName).toBe('Aerojet Academy')
    })

    it('has rpID', () => {
      expect(rpConfig.rpID).toBeDefined()
      expect(typeof rpConfig.rpID).toBe('string')
    })

    it('has origin array', () => {
      expect(Array.isArray(rpConfig.origin)).toBe(true)
      expect(rpConfig.origin.length).toBeGreaterThan(0)
    })

    it('origin includes rpID', () => {
      const expectedOrigin = `https://${rpConfig.rpID}`
      expect(rpConfig.origin).toContain(expectedOrigin)
    })
  })
})
