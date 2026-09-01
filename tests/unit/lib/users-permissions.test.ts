import { describe, it, expect } from 'vitest'
import { getUserRole, getUserPermissions, hasPermission, canAccessRoute, USER_ROLES, DEFAULT_PERMISSIONS } from '@/lib/users/permissions'

describe('lib/users/permissions', () => {
  describe('USER_ROLES', () => {
    it('has expected roles', () => {
      expect(USER_ROLES.SUPER_ADMIN).toBeDefined()
      expect(USER_ROLES.ADMIN).toBeDefined()
      expect(USER_ROLES.STAFF).toBeDefined()
      expect(USER_ROLES.STUDENT).toBeDefined()
      expect(USER_ROLES.APPLICANT).toBeDefined()
    })
  })

  describe('DEFAULT_PERMISSIONS', () => {
    it('has permissions for each role', () => {
      for (const [role, permissions] of Object.entries(DEFAULT_PERMISSIONS)) {
        expect(Array.isArray(permissions)).toBe(true)
      }
    })
  })

  describe('getUserRole', () => {
    it('returns role by id', () => {
      expect(getUserRole('SUPER_ADMIN')).toBeDefined()
    })

    it('returns undefined for unknown role', () => {
      expect(getUserRole('UNKNOWN')).toBeUndefined()
    })
  })

  describe('getUserPermissions', () => {
    it('returns permissions for role', () => {
      const perms = getUserPermissions('SUPER_ADMIN')
      expect(Array.isArray(perms)).toBe(true)
    })

    it('returns empty array for unknown role', () => {
      expect(getUserPermissions('UNKNOWN')).toEqual([])
    })
  })

  describe('hasPermission', () => {
    it('returns true when user has permission', () => {
      expect(hasPermission('SUPER_ADMIN', 'MANAGE_USERS')).toBe(true)
    })

    it('returns false when user lacks permission', () => {
      expect(hasPermission('STUDENT', 'MANAGE_USERS')).toBe(false)
    })
  })

  describe('canAccessRoute', () => {
    it('returns true for staff route when staff', () => {
      expect(canAccessRoute('ADMIN', '/staff/dashboard')).toBe(true)
    })

    it('returns false for staff route when student', () => {
      expect(canAccessRoute('STUDENT', '/staff/dashboard')).toBe(false)
    })

    it('returns true for public route', () => {
      expect(canAccessRoute('APPLICANT', '/courses')).toBe(true)
    })
  })
})
