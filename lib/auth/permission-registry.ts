import 'server-only'
import { unstable_cache, revalidateTag } from 'next/cache'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { PERMISSIONS } from './permissions'

/**
 * A.6.c — RBAC builder.
 *
 * Single source of truth for "does user X have permission Y?". Reads:
 *   1. The `Permission` table (canonical key/label/description registry)
 *   2. `RoleGrant` rows (role-scoped or user-scoped, optional expiry)
 *   3. Legacy `StaffProfile.permissions` JSON array (back-compat)
 *
 * ADMIN and SUPER_ADMIN bypass all checks.
 *
 * Cached per (userId,role) for 60 seconds via `unstable_cache`; bust via
 * `invalidatePermissionsFor(userId)` or `invalidateRolePermissions(role)`
 * after any grant change.
 */

export const PERMISSION_CACHE_TAG = 'permissions'

/** New keys not present in the legacy PERMISSIONS enum; seeded on demand. */
export const ADDITIONAL_PERMISSION_KEYS = {
  MANAGE_REFERRALS: 'MANAGE_REFERRALS',
  MANAGE_GDPR: 'MANAGE_GDPR',
  MANAGE_RBAC: 'MANAGE_RBAC',
  VIEW_REPLICATION: 'VIEW_REPLICATION',
  EXAM_BANK_EDIT: 'EXAM_BANK_EDIT',
  EXAM_BANK_REVIEW: 'EXAM_BANK_REVIEW',
  EXAM_SESSION_MONITOR: 'EXAM_SESSION_MONITOR',
  EXAM_RESULTS_PUBLISH: 'EXAM_RESULTS_PUBLISH',
  EXAM_SESSION_EXTEND: 'EXAM_SESSION_EXTEND',
  EXAM_VIOLATION_REVIEW: 'EXAM_VIOLATION_REVIEW',
} as const

/** All known seedable keys with their metadata. */
export const SEED_PERMISSIONS: Array<{
  key: string
  label: string
  description: string
  category: string
}> = [
  { key: PERMISSIONS.APPROVE_PAYMENTS, label: 'Approve payments', description: 'Reconcile and approve student payments', category: 'FINANCE' },
  { key: PERMISSIONS.MANAGE_USERS, label: 'Manage users', description: 'Create, edit, deactivate user accounts', category: 'USERS' },
  { key: PERMISSIONS.MANAGE_ROLES, label: 'Manage roles', description: 'Change a user\'s role (e.g. STUDENT → INSTRUCTOR)', category: 'USERS' },
  { key: PERMISSIONS.MANAGE_EXAMS, label: 'Manage exams', description: 'Create/edit exam events, sittings, results', category: 'EXAMS' },
  { key: PERMISSIONS.MANAGE_ENROLLMENTS, label: 'Manage enrollments', description: 'Approve, transfer, advance enrollments', category: 'ENROLLMENT' },
  { key: PERMISSIONS.VIEW_AUDIT_LOGS, label: 'View audit logs', description: 'Read the system audit trail', category: 'GOVERNANCE' },
  { key: PERMISSIONS.MANAGE_SETTINGS, label: 'Manage settings', description: 'Edit system settings, thresholds, toggles', category: 'GOVERNANCE' },
  { key: ADDITIONAL_PERMISSION_KEYS.MANAGE_REFERRALS, label: 'Manage referrals', description: 'Review fraud flags, approve payouts, disqualify referrals', category: 'FINANCE' },
  { key: ADDITIONAL_PERMISSION_KEYS.MANAGE_GDPR, label: 'Manage data protection', description: 'Process data-subject requests, edit retention policies', category: 'GOVERNANCE' },
  { key: ADDITIONAL_PERMISSION_KEYS.MANAGE_RBAC, label: 'Manage RBAC', description: 'Grant/revoke permissions to roles and users', category: 'GOVERNANCE' },
  { key: ADDITIONAL_PERMISSION_KEYS.VIEW_REPLICATION, label: 'View replication health', description: 'Inspect Neon↔Supabase sync status', category: 'GOVERNANCE' },

  // Internal exam system
  { key: ADDITIONAL_PERMISSION_KEYS.EXAM_BANK_EDIT, label: 'Edit exam bank questions', description: 'Create, edit, and manage exam bank questions', category: 'EXAMS' },
  { key: ADDITIONAL_PERMISSION_KEYS.EXAM_BANK_REVIEW, label: 'Review/approve exam questions', description: 'Review and approve exam questions for publication', category: 'EXAMS' },
  { key: ADDITIONAL_PERMISSION_KEYS.EXAM_SESSION_MONITOR, label: 'Monitor live exam sessions', description: 'Monitor live exam sessions in real time', category: 'EXAMS' },
  { key: ADDITIONAL_PERMISSION_KEYS.EXAM_RESULTS_PUBLISH, label: 'Publish exam results', description: 'Publish and unpublish exam results', category: 'EXAMS' },
  { key: ADDITIONAL_PERMISSION_KEYS.EXAM_SESSION_EXTEND, label: 'Extend exam time / force-submit', description: 'Extend exam time and force-submit active exam sessions', category: 'EXAMS' },
  { key: ADDITIONAL_PERMISSION_KEYS.EXAM_VIOLATION_REVIEW, label: 'Review exam violations', description: 'Review and resolve exam violations', category: 'EXAMS' },
]

/** Seed the Permission table with the canonical keys. Idempotent. */
export async function seedPermissionRegistry() {
  for (const p of SEED_PERMISSIONS) {
    await prismaUnfiltered.permission.upsert({
      where: { key: p.key },
      create: { ...p, isSystem: true },
      update: { label: p.label, description: p.description, category: p.category, isSystem: true },
    })
  }
}

/** Read every permission key effective for `userId` with role `role`. */
async function readUserPermissions(userId: string, role: string): Promise<Set<string>> {
  // Auto-elevate admins. Everyone else needs explicit grants.
  if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
    const all = await prismaUnfiltered.permission.findMany({ select: { key: true } })
    return new Set(all.map((p) => p.key))
  }

  const now = new Date()
  const [roleGrants, userGrants, legacy] = await Promise.all([
    prismaUnfiltered.roleGrant.findMany({
      where: {
        scope: 'ROLE',
        targetKey: role,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: { permissionKey: true },
    }),
    prismaUnfiltered.roleGrant.findMany({
      where: {
        scope: 'USER',
        targetKey: userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: { permissionKey: true },
    }),
    prismaUnfiltered.staffProfile.findUnique({
      where: { userId },
      select: { permissions: true },
    }),
  ])

  const set = new Set<string>()
  for (const g of roleGrants) set.add(g.permissionKey)
  for (const g of userGrants) set.add(g.permissionKey)
  // Legacy StaffProfile.permissions array still honoured for back-compat.
  if (legacy?.permissions && Array.isArray(legacy.permissions)) {
    for (const p of legacy.permissions as unknown[]) {
      if (typeof p === 'string') set.add(p)
    }
  }
  return set
}

/**
 * Cached resolver. Cache key includes both userId and role so a role change
 * naturally misses the cache. 60s TTL keeps grant-revocation latency bounded.
 */
export const getEffectivePermissions = (userId: string, role: string): Promise<Set<string>> => {
  const fn = unstable_cache(
    async () => {
      const set = await readUserPermissions(userId, role)
      // Sets aren't JSON-serialisable; cache as array, hydrate back.
      return Array.from(set)
    },
    [`perms`, userId, role],
    { revalidate: 60, tags: [PERMISSION_CACHE_TAG, `perms:user:${userId}`, `perms:role:${role}`] }
  )
  return fn().then((arr) => new Set(arr))
}

/** Bust the cache for a single user (after editing their user-scoped grants). */
export function invalidatePermissionsFor(userId: string) {
  revalidateTag(`perms:user:${userId}`, 'max')
}

/** Bust the cache for every user with a given role. */
export function invalidateRolePermissions(role: string) {
  revalidateTag(`perms:role:${role}`, 'max')
}

/** Bust everything (use sparingly — only on seed or bulk edits). */
export function invalidateAllPermissions() {
  revalidateTag(PERMISSION_CACHE_TAG, 'max')
}

/** Imperative check usable outside HTTP request lifecycle. */
export async function userHasPermission(
  userId: string,
  role: string,
  permissionKey: string
): Promise<boolean> {
  const set = await getEffectivePermissions(userId, role)
  return set.has(permissionKey)
}
