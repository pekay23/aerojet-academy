export const ROLE_HIERARCHY: Record<string, number> = {
  SUPER_ADMIN: 100,
  ADMIN: 80,
  STAFF: 60,
  EXAMINER: 50,
  INSTRUCTOR: 40,
  STUDENT: 20,
  APPLICANT: 10,
}

export function hasRole(userRole: string, requiredRole: string): boolean {
  return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[requiredRole] ?? 0)
}

export function isStaff(role: string): boolean {
  return ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'EXAMINER'].includes(role)
}

export function isAdmin(role: string): boolean {
  return ['SUPER_ADMIN', 'ADMIN'].includes(role)
}

export function isSuperAdmin(role: string): boolean {
  return role === 'SUPER_ADMIN'
}

export function canManageUsers(role: string): boolean {
  return isAdmin(role)
}

export function canApprovePayments(role: string): boolean {
  return isStaff(role)
}

export function canManageExams(role: string): boolean {
  return isStaff(role)
}

export function canViewReports(role: string): boolean {
  return isStaff(role)
}

export function canGoNoGo(role: string): boolean {
  return isAdmin(role)
}

// ---------------------------------------------------------------------------
// GRANULAR PERMISSION SYSTEM (DB-backed via StaffProfile.permissions)
// ---------------------------------------------------------------------------

import prisma from '@/lib/prisma/client'
import { getAuthSession } from './auth-options'

export const PERMISSIONS = {
  APPROVE_PAYMENTS: 'APPROVE_PAYMENTS',
  MANAGE_USERS: 'MANAGE_USERS',
  MANAGE_ROLES: 'MANAGE_ROLES',
  MANAGE_EXAMS: 'MANAGE_EXAMS',
  MANAGE_ENROLLMENTS: 'MANAGE_ENROLLMENTS',
  VIEW_AUDIT_LOGS: 'VIEW_AUDIT_LOGS',
  MANAGE_SETTINGS: 'MANAGE_SETTINGS',
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

export async function getStaffPermissions(userId: string): Promise<Permission[]> {
  const staffProfile = await prisma.staffProfile.findUnique({
    where: { userId },
    select: { permissions: true },
  })
  if (!staffProfile?.permissions) return []
  const perms = staffProfile.permissions as unknown
  return Array.isArray(perms) ? (perms as Permission[]) : []
}

export async function hasPermission(
  userId: string,
  role: string,
  permission: Permission
): Promise<boolean> {
  if (role === 'ADMIN' || role === 'SUPER_ADMIN') return true
  const permissions = await getStaffPermissions(userId)
  return permissions.includes(permission)
}

/**
 * Require a specific permission for the current session user.
 * ADMIN/SUPER_ADMIN bypass all checks. STAFF needs explicit permission.
 */
export async function requirePermission(
  permission: Permission
): Promise<{ id: string; role: string }> {
  const session = await getAuthSession()
  if (!session) throw new Error('Unauthorized')

  const user = session.user as any
  if (!['STAFF', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
    throw new Error('Staff access required')
  }

  const allowed = await hasPermission(user.id, user.role, permission)
  if (!allowed) {
    throw new Error(`Permission denied: ${permission}`)
  }

  return { id: user.id, role: user.role }
}
