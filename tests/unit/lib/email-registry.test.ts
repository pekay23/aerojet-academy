import { describe, it, expect } from 'vitest'
import { SYSTEM_EMAIL_INVENTORY } from '@/lib/email/registry'

describe('lib/email/registry', () => {
  describe('SYSTEM_EMAIL_INVENTORY', () => {
    it('has at least 5 entries', () => {
      expect(SYSTEM_EMAIL_INVENTORY.length).toBeGreaterThanOrEqual(5)
    })

    it('has required fields for each entry', () => {
      for (const entry of SYSTEM_EMAIL_INVENTORY) {
        expect(entry.title).toBeDefined()
        expect(entry.description).toBeDefined()
        expect(entry.address).toBeDefined()
        expect(entry.address).toContain('@')
      }
    })

    it('includes transactional sender', () => {
      const transactional = SYSTEM_EMAIL_INVENTORY.find((e) => e.title === 'Transactional sender')
      expect(transactional).toBeDefined()
    })

    it('includes no-reply sender', () => {
      const noReply = SYSTEM_EMAIL_INVENTORY.find((e) => e.title === 'No-reply / system')
      expect(noReply).toBeDefined()
    })
  })
})
