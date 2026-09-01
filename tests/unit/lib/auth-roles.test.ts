import { describe, it, expect } from 'vitest'
import { getRoleLevel, hasRoleLevel, compareRoleLevels, ROLE_LEVELS, ROLE_HIERARCHY } from '@/lib/auth/roles'

describe('lib/auth/roles', () => {
  describe('ROLE_LEVELS', () => {
    it('has level for each role', () => {
      expect(ROLE_LEVELS.SUPER_ADMIN).toBeDefined()
      expect(ROLE_LEVELS.ADMIN).toBeDefined()
      expect(ROLE_LEVELS.STAFF).toBeDefined()
      expect(ROLE_LEVELS.STUDENT).toBeDefined()
    })

    it('levels are numbers', () => {
      for (const level of Object.values(ROLE_LEVELS)) {
        expect(typeof level).toBe('number')
      }
    })
  })

  describe('ROLE_HIERARCHY', () => {
    it('is an array', () => {
      expect(Array.isArray(ROLE_HIERARCHY)).toBe(true)
    })

    it('has roles in descending order', () => {
      expect(ROLE_HIERARCHY[0]).toBe('SUPER_ADMIN')
      expect(ROLE_HIERARCHY[ROLE_HIERARCHY.length - 1]).toBe('APPLICANT')
    })
  })

  describe('getRoleLevel', () => {
    it('returns level for role', () => {
      expect(getRoleLevel('SUPER_ADMIN')).toBe(ROLE_LEVELS.SUPER_ADMIN)
    })

    it('returns 0 for unknown role', () => {
      expect(getRoleLevel('UNKNOWN')).toBe(0)
    })
  })

  describe('hasRoleLevel', () => {
    it('returns true when user level meets requirement', () => {
      expect(hasRoleLevel('ADMIN', 'STAFF')).toBe(true)
    })

    it('returns false when user level below requirement', () => {
      expect(hasRoleLevel('STUDENT', 'STAFF')).toBe(false)
    })
  })

  describe('compareRoleLevels', () => {
    it('returns 1 when first role is higher', () => {
      expect(compareRoleLevels('ADMIN', 'STAFF')).toBe(1)
    })

    it('returns -1 when first role is lower', () => {
      expect(compareRoleLevels('STAFF', 'ADMIN')).toBe(-1)
    })

    it('returns 0 when roles are equal', () => {
      expect(compareRoleLevels('ADMIN', 'ADMIN')).toBe(0)
    })
  })
})
