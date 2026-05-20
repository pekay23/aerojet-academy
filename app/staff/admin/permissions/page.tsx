import { Metadata } from 'next'
import { requireAdmin } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { seedPermissionRegistry } from '@/lib/auth/permission-registry'
import { ROUTE_PERMISSION_BINDINGS } from '@/lib/auth/permission-routes'
import PermissionManager from './_components/PermissionManager'

export const metadata: Metadata = { title: 'RBAC Permissions | Staff' }
export const dynamic = 'force-dynamic'

const KNOWN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'EXAMINER', 'INSTRUCTOR'] as const

export default async function PermissionsAdminPage() {
  await requireAdmin()

  // Seed on first visit so the table is never empty for the admin UI.
  await seedPermissionRegistry()

  const [permissions, grants, staffUsers] = await Promise.all([
    prismaUnfiltered.permission.findMany({ orderBy: [{ category: 'asc' }, { key: 'asc' }] }),
    prismaUnfiltered.roleGrant.findMany({
      orderBy: { createdAt: 'desc' },
      include: { permission: true, grantedBy: { include: { profile: true } } },
    }),
    prismaUnfiltered.user.findMany({
      where: { role: { in: ['STAFF', 'EXAMINER', 'INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN'] }, deletedAt: null },
      select: { id: true, email: true, role: true, profile: { select: { firstName: true, lastName: true } } },
      orderBy: { email: 'asc' },
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-aerojet-blue dark:text-white">
          RBAC Permissions
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Manage the permission registry and grant permissions to roles or individual users.
          ADMIN and SUPER_ADMIN bypass all checks.
        </p>
      </div>

      <PermissionManager
        permissions={permissions.map((p) => ({
          key: p.key,
          label: p.label,
          description: p.description,
          category: p.category,
          isSystem: p.isSystem,
        }))}
        grants={grants.map((g) => ({
          id: g.id,
          scope: g.scope,
          targetKey: g.targetKey,
          permissionKey: g.permissionKey,
          permissionLabel: g.permission.label,
          grantedByName:
            g.grantedBy?.profile?.firstName && g.grantedBy?.profile?.lastName
              ? `${g.grantedBy.profile.firstName} ${g.grantedBy.profile.lastName}`
              : (g.grantedBy?.email ?? null),
          expiresAt: g.expiresAt ? g.expiresAt.toISOString() : null,
          createdAt: g.createdAt.toISOString(),
        }))}
        roles={[...KNOWN_ROLES]}
        staffUsers={staffUsers.map((u) => ({
          id: u.id,
          email: u.email,
          role: u.role,
          name:
            u.profile?.firstName && u.profile?.lastName
              ? `${u.profile.firstName} ${u.profile.lastName}`
              : u.email,
        }))}
        routeBindings={ROUTE_PERMISSION_BINDINGS}
      />
    </div>
  )
}
