import { describe, it, expect } from 'vitest'
import { getStaffRole, canManageStaff, getStaffPermissions, STAFF_ROLES, STAFF_PERMISSIONS } from '@/lib/staff/roles'

describe('lib/staff/roles', () => {
  describe('STAFF_ROLES', () => {
    it('has expected roles', () => {
      expect(STAFF_ROLES.SUPER_ADMIN).toBeDefined()
      expect(STAFF_ROLES.ADMIN).toBeDefined()
      expect(STAFF_ROLES.STAFF).toBeDefined()
    })

    it('each role has level', () => {
      for (const [key, role] of Object.entries(STAFF_ROLES)) {
        expect(role.level).toBeDefined()
        expect(typeof role.level).toBe('number')
      }
    })
  })

  describe('STAFF_PERMISSIONS', () => {
    it('has expected permissions', () => {
      expect(STAFF_PERMISSIONS.MANAGE_USERS).toBeDefined()
      expect(STAFF_PERMISSIONS.MANAGE_COURSES).toBeDefined()
      expect(STAFF_PERMISSIONS.MANAGE_FINANCE).toBeDefined()
    })
  })

  describe('getStaffRole', () => {
    it('returns role by id', () => {
      expect(getStaffRole('SUPER_ADMIN')).toBeDefined()
    })

    it('returns undefined for unknown role', () => {
      expect(getStaffRole('UNKNOWN')).toBeUndefined()
    })
  })

  describe('canManageStaff', () => {
    it('returns true for super admin', () => {
      expect(canManageStaff('SUPER_ADMIN')).toBe(true)
    })

    it('returns true for admin', () => {
      expect(canManageStaff('ADMIN')).toBe(true)
    })

    it('returns false for regular staff', () => {
      expect(canManageStaff('STAFF')).toBe(false)
    })
  })

  describe('getStaffPermissions', () => {
    it('returns permissions array', () => {
      const permissions = getStaffPermissions('SUPER_ADMIN')
      expect(Array.isArray(permissions)).toBe(true)
    })

    it('returns empty array for unknown role', () => {
      expect(getStaffPermissions('UNKNOWN')).toEqual([])
    })
  })
})
