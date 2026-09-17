import { PERMISSIONS } from './permissions'
import { ADDITIONAL_PERMISSION_KEYS } from './permission-registry'

/**
 * Declarative mapping of API route prefixes to the permission key they
 * require. Used by the admin UI at `/staff/admin/permissions` to render
 * a "what does this permission gate?" view, and consultable at runtime
 * via `requiredPermissionForPath()`.
 *
 * This is documentation-grade: handler-side `requirePermission()` calls
 * remain authoritative. Treat divergence between this table and an actual
 * route as a code-review red flag.
 */
export interface RoutePermissionBinding {
  /** URL prefix match (longest wins). */
  prefix: string
  /** Permission key required to call the route. */
  permission: string
  /** Optional brief label for the admin UI. */
  description?: string
}

export const ROUTE_PERMISSION_BINDINGS: RoutePermissionBinding[] = [
  // Finance
  { prefix: '/api/staff/payments', permission: PERMISSIONS.APPROVE_PAYMENTS, description: 'Approve/reject payment proofs' },
  { prefix: '/api/staff/finance/wallet-topups', permission: PERMISSIONS.APPROVE_PAYMENTS, description: 'Approve/reject wallet top-ups' },
  { prefix: '/api/staff/finance/refunds', permission: PERMISSIONS.APPROVE_PAYMENTS, description: 'Approve refund requests' },

  // Users
  { prefix: '/api/staff/users/create', permission: PERMISSIONS.MANAGE_USERS, description: 'Create staff/instructor accounts' },
  { prefix: '/api/staff/users/[id]/role', permission: PERMISSIONS.MANAGE_ROLES, description: 'Change a user\'s role' },

  // Enrollments
  { prefix: '/api/staff/enrollments', permission: PERMISSIONS.MANAGE_ENROLLMENTS, description: 'Approve/edit enrollments' },

  // Exams
  { prefix: '/api/staff/exam-events', permission: PERMISSIONS.MANAGE_EXAMS, description: 'Manage exam events + go/no-go' },

  // Internal exam system (banks, sessions, violations)
  { prefix: '/api/staff/exams/internal/banks', permission: PERMISSIONS.MANAGE_EXAMS, description: 'Manage internal exam bank instructors + schedule' },
  { prefix: '/api/staff/exams/internal/sessions/[id]/extend', permission: ADDITIONAL_PERMISSION_KEYS.EXAM_SESSION_EXTEND, description: 'Extend exam time' },
  { prefix: '/api/staff/exams/internal/sessions/[id]/force-submit', permission: ADDITIONAL_PERMISSION_KEYS.EXAM_SESSION_EXTEND, description: 'Force-submit an active exam session' },
  { prefix: '/api/staff/exams/internal/sessions/[id]/violations/[violationId]/review', permission: ADDITIONAL_PERMISSION_KEYS.EXAM_VIOLATION_REVIEW, description: 'Review exam violations' },

  // Instructor exam endpoints
  { prefix: '/api/instructor/exams/banks', permission: ADDITIONAL_PERMISSION_KEYS.EXAM_BANK_EDIT, description: 'Instructor bank question editor' },
  { prefix: '/api/instructor/exams/classes', permission: ADDITIONAL_PERMISSION_KEYS.EXAM_SESSION_MONITOR, description: 'Monitor / start instructor exam sessions' },

  // Internal exam system (banks, sessions, violations)
  { prefix: '/api/staff/exams/internal/banks', permission: PERMISSIONS.MANAGE_EXAMS, description: 'Manage internal exam bank instructors + schedule' },
  { prefix: '/api/staff/exams/internal/sessions/[id]/extend', permission: ADDITIONAL_PERMISSION_KEYS.EXAM_SESSION_EXTEND, description: 'Extend exam time' },
  { prefix: '/api/staff/exams/internal/sessions/[id]/force-submit', permission: ADDITIONAL_PERMISSION_KEYS.EXAM_SESSION_EXTEND, description: 'Force-submit an active exam session' },
  { prefix: '/api/staff/exams/internal/sessions/[id]/violations/[violationId]/review', permission: ADDITIONAL_PERMISSION_KEYS.EXAM_VIOLATION_REVIEW, description: 'Review exam violations' },

  // Instructor exam endpoints
  { prefix: '/api/instructor/exams/banks', permission: ADDITIONAL_PERMISSION_KEYS.EXAM_BANK_EDIT, description: 'Instructor bank question editor' },
  { prefix: '/api/instructor/exams/classes', permission: ADDITIONAL_PERMISSION_KEYS.EXAM_SESSION_MONITOR, description: 'Monitor / start instructor exam sessions' },

  // Governance
  { prefix: '/api/staff/audit-logs', permission: PERMISSIONS.VIEW_AUDIT_LOGS, description: 'Read audit trail' },
  { prefix: '/api/staff/admin/permissions', permission: ADDITIONAL_PERMISSION_KEYS.MANAGE_RBAC, description: 'Manage the permission registry + grants' },

  // Referrals
  { prefix: '/api/staff/referrals', permission: ADDITIONAL_PERMISSION_KEYS.MANAGE_REFERRALS, description: 'Review fraud + approve payouts' },

  // GDPR
  { prefix: '/api/staff/gdpr', permission: ADDITIONAL_PERMISSION_KEYS.MANAGE_GDPR, description: 'Process data-subject requests' },
  { prefix: '/api/staff/users/[id]/gdpr-export', permission: ADDITIONAL_PERMISSION_KEYS.MANAGE_GDPR },
  { prefix: '/api/staff/users/[id]/anonymise', permission: ADDITIONAL_PERMISSION_KEYS.MANAGE_GDPR },
  { prefix: '/api/staff/settings/retention', permission: ADDITIONAL_PERMISSION_KEYS.MANAGE_GDPR },

  // Settings
  { prefix: '/api/staff/settings', permission: PERMISSIONS.MANAGE_SETTINGS, description: 'Edit system settings' },
]

export function requiredPermissionForPath(pathname: string): RoutePermissionBinding | null {
  const matches = ROUTE_PERMISSION_BINDINGS.filter((b) =>
    pathname.startsWith(b.prefix.replace(/\[[^/\]]+\]/g, '*').replace(/\*/g, ''))
  )
  if (matches.length === 0) return null
  // Longest prefix wins so `/api/staff/users/[id]/role` beats `/api/staff/users/create`.
  return matches.sort((a, b) => b.prefix.length - a.prefix.length)[0]
}
