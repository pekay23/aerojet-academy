import { describe, it, expect } from 'vitest'
import { ROLE_HIERARCHY, hasRole, isStaff, isAdmin, isSuperAdmin, canManageUsers, canApprovePayments, canManageExams, canViewReports, canGoNoGo, PERMISSIONS, hasPermission, requirePermission } from '@/lib/auth/permissions'

describe('lib/auth/permissions', () => {
  describe('ROLE_HIERARCHY', () => {
    it('has correct hierarchy values', () => {
      expect(ROLE_HIERARCHY.SUPER_ADMIN).toBe(100)
      expect(ROLE_HIERARCHY.ADMIN).toBe(80)
      expect(ROLE_HIERARCHY.STAFF).toBe(60)
      expect(ROLE_HIERARCHY.EXAMINER).toBe(50)
      expect(ROLE_HIERARCHY.INSTRUCTOR).toBe(40)
      expect(ROLE_HIERARCHY.STUDENT).toBe(20)
      expect(ROLE_HIERARCHY.APPLICANT).toBe(10)
    })
  })

  describe('hasRole', () => {
    it('returns true when user role meets requirement', () => {
      expect(hasRole('ADMIN', 'STAFF')).toBe(true)
      expect(hasRole('SUPER_ADMIN', 'ADMIN')).toBe(true)
    })

    it('returns false when user role does not meet requirement', () => {
      expect(hasRole('STUDENT', 'STAFF')).toBe(false)
      expect(hasRole('APPLICANT', 'STUDENT')).toBe(false)
    })

    it('handles unknown roles', () => {
      expect(hasRole('UNKNOWN', 'STAFF')).toBe(false)
    })
  })

  describe('isStaff', () => {
    it('returns true for staff roles', () => {
      expect(isStaff('SUPER_ADMIN')).toBe(true)
      expect(isStaff('ADMIN')).toBe(true)
      expect(isStaff('STAFF')).toBe(true)
      expect(isStaff('EXAMINER')).toBe(true)
    })

    it('returns false for non-staff roles', () => {
      expect(isStaff('INSTRUCTOR')).toBe(false)
      expect(isStaff('STUDENT')).toBe(false)
      expect(isStaff('APPLICANT')).toBe(false)
    })
  })

  describe('isAdmin', () => {
    it('returns true for admin roles', () => {
      expect(isAdmin('SUPER_ADMIN')).toBe(true)
      expect(isAdmin('ADMIN')).toBe(true)
    })

    it('returns false for non-admin roles', () => {
      expect(isAdmin('STAFF')).toBe(false)
      expect(isAdmin('STUDENT')).toBe(false)
    })
  })

  describe('isSuperAdmin', () => {
    it('returns true only for SUPER_ADMIN', () => {
      expect(isSuperAdmin('SUPER_ADMIN')).toBe(true)
      expect(isSuperAdmin('ADMIN')).toBe(false)
    })
  })

  describe('PERMISSIONS', () => {
    it('has all expected permission keys', () => {
      expect(PERMISSIONS.APPROVE_PAYMENTS).toBe('APPROVE_PAYMENTS')
      expect(PERMISSIONS.MANAGE_USERS).toBe('MANAGE_USERS')
      expect(PERMISSIONS.MANAGE_ROLES).toBe('MANAGE_ROLES')
      expect(PERMISSIONS.MANAGE_EXAMS).toBe('MANAGE_EXAMS')
      expect(PERMISSIONS.MANAGE_ENROLLMENTS).toBe('MANAGE_ENROLLMENTS')
      expect(PERMISSIONS.VIEW_AUDIT_LOGS).toBe('VIEW_AUDIT_LOGS')
      expect(PERMISSIONS.MANAGE_SETTINGS).toBe('MANAGE_SETTINGS')
    })
  })
})
