'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Trash2, UserPlus, X } from 'lucide-react'

interface Permission {
  key: string
  label: string
  description: string | null
  category: string
  isSystem: boolean
}
interface Grant {
  id: string
  scope: 'ROLE' | 'USER'
  targetKey: string
  permissionKey: string
  permissionLabel: string
  grantedByName: string | null
  expiresAt: string | null
  createdAt: string
}
interface StaffUser {
  id: string
  email: string
  role: string
  name: string
}
interface RouteBinding {
  prefix: string
  permission: string
  description?: string
}

export default function PermissionManager({
  permissions,
  grants,
  roles,
  staffUsers,
  routeBindings,
}: {
  permissions: Permission[]
  grants: Grant[]
  roles: string[]
  staffUsers: StaffUser[]
  routeBindings: RouteBinding[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [tab, setTab] = useState<'registry' | 'grants' | 'routes'>('registry')
  const [filter, setFilter] = useState('')

  const grouped = useMemo(() => {
    const map = new Map<string, Permission[]>()
    for (const p of permissions) {
      if (filter && !p.key.toLowerCase().includes(filter.toLowerCase()) && !p.label.toLowerCase().includes(filter.toLowerCase()))
        continue
      const arr = map.get(p.category) ?? []
      arr.push(p)
      map.set(p.category, arr)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [permissions, filter])

  const call = async (url: string, init: RequestInit, okMsg: string) => {
    const res = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...(init.headers || {}) } })
    const json = await res.json().catch(() => ({}))
    if (!res.ok || json?.success === false) {
      toast.error(json?.error || `Request failed (${res.status})`)
      return false
    }
    toast.success(okMsg)
    startTransition(() => router.refresh())
    return true
  }

  const onCreatePermission = async () => {
    const key = prompt('Permission key (SCREAMING_SNAKE_CASE):')
    if (!key) return
    const label = prompt('Label:', key.replace(/_/g, ' ').toLowerCase())
    if (!label) return
    const category = prompt('Category:', 'CUSTOM') || 'CUSTOM'
    await call('/api/staff/admin/permissions', {
      method: 'POST',
      body: JSON.stringify({ key: key.trim().toUpperCase(), label, category }),
    }, 'Permission created')
  }

  const onDeletePermission = async (key: string) => {
    if (!confirm(`Delete permission "${key}"? Existing grants are removed.`)) return
    await call(`/api/staff/admin/permissions/${key}`, { method: 'DELETE' }, 'Permission deleted')
  }

  const onGrant = async (scope: 'ROLE' | 'USER', targetKey: string, permissionKey: string) => {
    await call('/api/staff/admin/permissions/grants', {
      method: 'POST',
      body: JSON.stringify({ scope, targetKey, permissionKey }),
    }, 'Grant added')
  }

  const onRevoke = async (id: string) => {
    if (!confirm('Revoke this grant?')) return
    await call(`/api/staff/admin/permissions/grants/${id}`, { method: 'DELETE' }, 'Grant revoked')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
          {[
            ['registry', 'Registry'],
            ['grants', 'Grants'],
            ['routes', 'Route bindings'],
          ].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k as typeof tab)}
              className={`rounded-xl px-3 py-1.5 text-sm font-bold ${tab === k ? 'bg-white text-aerojet-blue shadow-sm dark:bg-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              {label}
            </button>
          ))}
        </div>
        {tab === 'registry' && (
          <div className="flex items-center gap-2">
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter…"
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
            <button
              disabled={isPending}
              onClick={onCreatePermission}
              className="flex items-center gap-1.5 rounded-lg bg-aerojet-blue px-3 py-1.5 text-sm font-bold text-white hover:bg-aerojet-blue/90 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> Add permission
            </button>
          </div>
        )}
      </div>

      {tab === 'registry' && (
        <div className="space-y-4">
          {grouped.map(([category, perms]) => (
            <div
              key={category}
              className="rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <p className="mb-3 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                {category}
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {perms.map((p) => (
                  <div key={p.key} className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-mono text-xs font-black text-slate-900 dark:text-slate-100">
                          {p.key}
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-slate-700 dark:text-slate-200">
                          {p.label}
                        </p>
                        {p.description && (
                          <p className="mt-1 text-xs text-slate-500">{p.description}</p>
                        )}
                      </div>
                      {!p.isSystem && (
                        <button
                          disabled={isPending}
                          onClick={() => onDeletePermission(p.key)}
                          className="text-slate-400 hover:text-red-600 disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'grants' && (
        <GrantsTab
          permissions={permissions}
          grants={grants}
          roles={roles}
          staffUsers={staffUsers}
          onGrant={onGrant}
          onRevoke={onRevoke}
          isPending={isPending}
        />
      )}

      {tab === 'routes' && (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase dark:bg-slate-800">
              <tr>
                <th className="px-4 py-2">Route prefix</th>
                <th className="px-4 py-2">Requires</th>
                <th className="px-4 py-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {routeBindings.map((b) => (
                <tr key={b.prefix} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-2 font-mono text-xs">{b.prefix}</td>
                  <td className="px-4 py-2 font-mono text-xs font-bold text-aerojet-blue">
                    {b.permission}
                  </td>
                  <td className="px-4 py-2 text-xs text-slate-500">{b.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function GrantsTab({
  permissions,
  grants,
  roles,
  staffUsers,
  onGrant,
  onRevoke,
  isPending,
}: {
  permissions: Permission[]
  grants: Grant[]
  roles: string[]
  staffUsers: StaffUser[]
  onGrant: (scope: 'ROLE' | 'USER', targetKey: string, permissionKey: string) => Promise<void>
  onRevoke: (id: string) => Promise<void>
  isPending: boolean
}) {
  const [scope, setScope] = useState<'ROLE' | 'USER'>('ROLE')
  const [targetKey, setTargetKey] = useState(roles[0] ?? '')
  const [permissionKey, setPermissionKey] = useState(permissions[0]?.key ?? '')

  return (
    <div className="space-y-4">
      <div className="grid gap-2 rounded-2xl border border-slate-100 bg-white p-4 sm:grid-cols-4 dark:border-slate-800 dark:bg-slate-900">
        <select
          value={scope}
          onChange={(e) => {
            const next = e.target.value as 'ROLE' | 'USER'
            setScope(next)
            setTargetKey(next === 'ROLE' ? (roles[0] ?? '') : (staffUsers[0]?.id ?? ''))
          }}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        >
          <option value="ROLE">Role</option>
          <option value="USER">User</option>
        </select>
        <select
          value={targetKey}
          onChange={(e) => setTargetKey(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        >
          {scope === 'ROLE'
            ? roles.map((r) => <option key={r} value={r}>{r}</option>)
            : staffUsers.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
        </select>
        <select
          value={permissionKey}
          onChange={(e) => setPermissionKey(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        >
          {permissions.map((p) => (
            <option key={p.key} value={p.key}>{p.key}</option>
          ))}
        </select>
        <button
          disabled={isPending || !targetKey || !permissionKey}
          onClick={() => onGrant(scope, targetKey, permissionKey)}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          <UserPlus className="h-4 w-4" /> Grant
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase dark:bg-slate-800">
            <tr>
              <th className="px-4 py-2">Scope</th>
              <th className="px-4 py-2">Target</th>
              <th className="px-4 py-2">Permission</th>
              <th className="px-4 py-2">Granted by</th>
              <th className="px-4 py-2">Expires</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {grants.map((g) => (
              <tr key={g.id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-4 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-black tracking-widest uppercase ${g.scope === 'ROLE' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'}`}>
                    {g.scope}
                  </span>
                </td>
                <td className="px-4 py-2 font-mono text-xs">{g.targetKey}</td>
                <td className="px-4 py-2 font-mono text-xs font-bold text-aerojet-blue">{g.permissionKey}</td>
                <td className="px-4 py-2 text-xs">{g.grantedByName ?? '—'}</td>
                <td className="px-4 py-2 text-xs">{g.expiresAt ? new Date(g.expiresAt).toLocaleDateString() : 'Never'}</td>
                <td className="px-4 py-2 text-right">
                  <button
                    disabled={isPending}
                    onClick={() => onRevoke(g.id)}
                    className="text-slate-400 hover:text-red-600 disabled:opacity-50"
                    title="Revoke"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {grants.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">
                  No grants yet — every non-admin user falls back to defaults.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
