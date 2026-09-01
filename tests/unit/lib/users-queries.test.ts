import { describe, it, expect } from 'vitest'
import { getUserById, getUserByEmail, searchUsers, getUsersByRole, USER_ROLES, USER_STATUS } from '@/lib/users/queries'

describe('lib/users/queries', () => {
  describe('USER_ROLES', () => {
    it('has expected roles', () => {
      expect(USER_ROLES.SUPER_ADMIN).toBeDefined()
      expect(USER_ROLES.ADMIN).toBeDefined()
      expect(USER_ROLES.STAFF).toBeDefined()
      expect(USER_ROLES.STUDENT).toBeDefined()
    })
  })

  describe('USER_STATUS', () => {
    it('has expected status values', () => {
      expect(USER_STATUS.ACTIVE).toBe('ACTIVE')
      expect(USER_STATUS.INACTIVE).toBe('INACTIVE')
      expect(USER_STATUS.SUSPENDED).toBe('SUSPENDED')
    })
  })

  describe('getUserById', () => {
    it('returns user by id', () => {
      const user = getUserById('user-1')
      expect(user).toBeDefined()
      expect(user?.id).toBe('user-1')
    })

    it('returns undefined for unknown id', () => {
      expect(getUserById('unknown')).toBeUndefined()
    })
  })

  describe('getUserByEmail', () => {
    it('returns user by email', () => {
      const user = getUserByEmail('test@example.com')
      expect(user).toBeDefined()
      expect(user?.email).toBe('test@example.com')
    })

    it('returns undefined for unknown email', () => {
      expect(getUserByEmail('unknown@example.com')).toBeUndefined()
    })
  })

  describe('searchUsers', () => {
    it('returns matching users', () => {
      const users = searchUsers('john')
      expect(Array.isArray(users)).toBe(true)
    })

    it('returns empty array for no matches', () => {
      const users = searchUsers('nonexistentuserxyz')
      expect(users).toEqual([])
    })
  })

  describe('getUsersByRole', () => {
    it('returns users for role', () => {
      const users = getUsersByRole('STUDENT')
      expect(Array.isArray(users)).toBe(true)
    })

    it('returns empty array for unknown role', () => {
      expect(getUsersByRole('UNKNOWN')).toEqual([])
    })
  })
})
