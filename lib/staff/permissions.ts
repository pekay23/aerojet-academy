import { isStaff, isAdmin, isSuperAdmin } from '@/lib/auth/permissions'

export const STAFF_PERMISSIONS = {
  VIEW_DASHBOARD: (role: string) => isStaff(role),
  MANAGE_APPLICANTS: (role: string) => isStaff(role),
  APPROVE_PAYMENTS: (role: string) => isStaff(role),
  MANAGE_COURSES: (role: string) => isStaff(role),
  MANAGE_CLASSES: (role: string) => isStaff(role),
  MANAGE_EXAMS: (role: string) => isStaff(role),
  GO_NO_GO: (role: string) => isAdmin(role),
  MANAGE_USERS: (role: string) => isAdmin(role),
  VIEW_AUDIT_LOGS: (role: string) => isAdmin(role),
  MANAGE_SETTINGS: (role: string) => isSuperAdmin(role),
  VIEW_REPORTS: (role: string) => isStaff(role),
  MANAGE_INSTRUCTORS: (role: string) => isAdmin(role),
  BULK_OPERATIONS: (role: string) => isAdmin(role),
} as const

export function checkPermission(role: string, permission: keyof typeof STAFF_PERMISSIONS): boolean {
  return STAFF_PERMISSIONS[permission](role)
}
