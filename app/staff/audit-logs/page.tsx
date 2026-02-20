import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma/client'
import { Metadata } from 'next'
import { ScrollText, Search, User as UserIcon } from 'lucide-react'
import { format } from 'date-fns'

export const metadata: Metadata = { title: 'Audit Logs | Staff Portal' }

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; action?: string; page?: string }>
}) {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const { query, action, page } = await searchParams
  const pageNum = parseInt(page ?? '1', 10)
  const perPage = 50

  const logs = await prisma.auditLog.findMany({
    where: {
      AND: [
        query
          ? {
              OR: [
                { description: { contains: query, mode: 'insensitive' } },
                { entity: { contains: query, mode: 'insensitive' } },
                { action: { contains: query, mode: 'insensitive' } },
              ],
            }
          : {},
        action ? { action: { contains: action, mode: 'insensitive' } } : {},
      ],
    },
    include: {
      user: {
        select: {
          email: true,
          profile: { select: { firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: perPage,
    skip: (pageNum - 1) * perPage,
  })

  const total = await prisma.auditLog.count({
    where: {
      AND: [
        query
          ? {
              OR: [
                { description: { contains: query, mode: 'insensitive' } },
                { entity: { contains: query, mode: 'insensitive' } },
                { action: { contains: query, mode: 'insensitive' } },
              ],
            }
          : {},
        action ? { action: { contains: action, mode: 'insensitive' } } : {},
      ],
    },
  })

  // Resolve entityIds to human-readable labels.
  // For 'users' entities: show registrationCode ?? email.
  // For anything else: show the raw entityId.
  const userEntityIds = [
    ...new Set(
      logs
        .filter((l) => l.entity?.toLowerCase() === 'users' && l.entityId)
        .map((l) => l.entityId as string)
    ),
  ]

  const relatedUsers = userEntityIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userEntityIds } },
        select: { id: true, registrationCode: true, email: true },
      })
    : []

  const entityLabels: Record<string, string> = {}
  for (const u of relatedUsers) {
    entityLabels[u.id] = u.registrationCode ?? u.email
  }

  function actionColor(act: string) {
    if (act.includes('DELETE') || act.includes('REJECT') || act.includes('SUSPEND'))
      return 'bg-red-100 text-red-700'
    if (act.includes('CREATE') || act.includes('APPROVE') || act.includes('ACTIVATE'))
      return 'bg-green-100 text-green-700'
    if (act.includes('UPDATE') || act.includes('EDIT')) return 'bg-blue-100 text-blue-700'
    if (act.includes('LOGIN') || act.includes('LOGOUT')) return 'bg-purple-100 text-purple-700'
    return 'bg-slate-100 text-slate-700'
  }

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-[#002a5c] dark:text-white">Audit Logs</h1>
        <p className="text-slate-500 dark:text-slate-400">Track all system activity and changes</p>
      </div>

      {/* Search */}
      <form className="mb-6 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            name="query"
            defaultValue={query}
            placeholder="Search by action, entity, or description…"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-[#002a5c] focus:outline-none focus:ring-2 focus:ring-[#002a5c]/20"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-[#002a5c] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#003875]"
        >
          Filter
        </button>
      </form>

      {/* Stats strip */}
      <div className="mb-4 text-sm text-slate-500 dark:text-slate-400">
        Showing <span className="font-bold text-slate-900 dark:text-slate-100">{logs.length}</span> of{' '}
        <span className="font-bold text-slate-900 dark:text-slate-100">{total.toLocaleString()}</span> log entries
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Entity</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/50">
                      <ScrollText className="h-6 w-6 text-slate-300" />
                    </div>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400">No audit logs found</p>
                    {query && (
                      <p className="text-xs text-slate-400">Try a different search query</p>
                    )}
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const userName = log.user?.profile
                    ? `${log.user.profile.firstName} ${log.user.profile.lastName}`
                    : (log.user?.email ?? '—')
                  return (
                    <tr key={log.id} className="hover:bg-slate-50 dark:bg-slate-800/50">
                      <td className="whitespace-nowrap px-6 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                        {format(log.createdAt, 'yyyy-MM-dd HH:mm:ss')}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-xs font-bold ${actionColor(log.action)}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-slate-600 dark:text-slate-400">
                        {log.entity ? (
                          <span className="font-mono text-xs">
                            <span className="font-semibold text-slate-700">{log.entity}</span>
                            {log.entityId && (
                              <span className="ml-1 text-slate-500 dark:text-slate-400">
                                #{entityLabels[log.entityId] ?? log.entityId}
                              </span>
                            )}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="max-w-xs truncate px-6 py-3 text-slate-700">
                        {log.description ?? '—'}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100">
                            <UserIcon className="h-3 w-3 text-slate-500 dark:text-slate-400" />
                          </div>
                          <span className="text-slate-700">{userName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 font-mono text-xs text-slate-400">
                        {log.ipAddress ?? '—'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > perPage && (
          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 px-6 py-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Page {pageNum} of {Math.ceil(total / perPage)}
            </p>
            <div className="flex gap-2">
              {pageNum > 1 && (
                <a
                  href={`?query=${query ?? ''}&page=${pageNum - 1}`}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-800/50"
                >
                  Previous
                </a>
              )}
              {pageNum * perPage < total && (
                <a
                  href={`?query=${query ?? ''}&page=${pageNum + 1}`}
                  className="rounded-lg bg-[#002a5c] px-4 py-2 text-sm font-bold text-white hover:bg-[#003875]"
                >
                  Next
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

