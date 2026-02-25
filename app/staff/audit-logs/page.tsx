import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma/client'
import { Metadata } from 'next'
import { Search, Activity } from 'lucide-react'
import AuditLogTable from './_components/AuditLogTable'

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

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm dark:bg-blue-900/30 dark:text-blue-400">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[#002a5c] dark:text-white">
              Audit Logs
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Track and monitor all system activity, changes, and authentications
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <form className="mb-6 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            name="query"
            defaultValue={query}
            placeholder="Search by action, entity, or description…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-4 pl-10 text-sm text-slate-900 placeholder-slate-400 focus:border-[#002a5c] focus:ring-2 focus:ring-[#002a5c]/20 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
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
        Showing <span className="font-bold text-slate-900 dark:text-slate-100">{logs.length}</span>{' '}
        of{' '}
        <span className="font-bold text-slate-900 dark:text-slate-100">
          {total.toLocaleString()}
        </span>{' '}
        log entries
      </div>

      {/* Table Component */}
      <div className="mt-6">
        <AuditLogTable logs={logs} entityLabels={entityLabels} query={query} />
      </div>

      {/* Pagination */}
      {total > perPage && (
        <div className="mt-6 flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-6 py-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Page <span className="text-slate-700 dark:text-slate-300">{pageNum}</span> of{' '}
            <span className="text-slate-700 dark:text-slate-300">{Math.ceil(total / perPage)}</span>
          </p>
          <div className="flex gap-2">
            {pageNum > 1 && (
              <a
                href={`?query=${query ?? ''}&page=${pageNum - 1}`}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-bold text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700"
              >
                Previous
              </a>
            )}
            {pageNum * perPage < total && (
              <a
                href={`?query=${query ?? ''}&page=${pageNum + 1}`}
                className="rounded-xl border border-transparent bg-[#002a5c] px-5 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#003875] hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600 dark:hover:bg-slate-700"
              >
                Next
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
