export const ROLE_HIERARCHY: Record<string, number> = {
  SUPER_ADMIN: 100,
  ADMIN: 80,
  STAFF: 60,
  INSTRUCTOR: 40,
  STUDENT: 20,
  APPLICANT: 10,
}

export function hasRole(userRole: string, requiredRole: string): boolean {
  return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[requiredRole] ?? 0)
}

export function isStaff(role: string): boolean {
  return ['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(role)
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
