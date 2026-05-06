'use client'

import { useState, useEffect } from 'react'
import TablePagination from '../../_components/TablePagination'
import { format } from 'date-fns'
import {
  ScrollText,
  User as UserIcon,
  X,
  ServerCrash,
  Activity,
  ShieldAlert,
  Cpu,
  Database,
  Fingerprint,
  ExternalLink,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type AuditLog = {
  id: string
  action: string
  entity: string | null
  entityId: string | null
  description: string | null
  createdAt: string | Date
  ipAddress: string | null
  user: {
    email: string
    profile: { firstName: string; lastName: string } | null
  } | null
}

import { memo } from 'react'

const LogRow = memo(
  ({
    log,
    idx,
    entityLabels,
    onSelect,
    actionStyle,
    getEntityIcon,
    getUserName,
    getUserInitials,
  }: {
    log: AuditLog
    idx: number
    entityLabels: Record<string, string>
    onSelect: (log: AuditLog) => void
    actionStyle: (act: string) => string
    getEntityIcon: (entity: string | null) => React.ReactNode
    getUserName: (log: AuditLog) => string
    getUserInitials: (name: string) => string
  }) => {
    const userName = getUserName(log)
    const initials = getUserInitials(userName)

    return (
      <motion.tr
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        // Only stagger the first 25 items to save main thread on large lists
        transition={{ delay: idx < 25 ? idx * 0.02 : 0, duration: 0.2 }}
        onClick={() => onSelect(log)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onSelect(log)
          }
        }}
        tabIndex={0}
        role="button"
        aria-label={`View details for ${log.action} on ${log.entity || 'system'}`}
        className="group relative cursor-pointer transition-all duration-150 ease-out hover:bg-white/80 dark:hover:bg-slate-800/40"
      >
        {/* Timestamp */}
        <td className="px-6 py-5">
          <div className="flex flex-col items-start justify-center">
            <span className="font-mono text-[10px] font-bold tracking-tighter text-slate-500 dark:text-slate-400">
              {format(new Date(log.createdAt), 'MMM dd, yyyy').toUpperCase()}
            </span>
            <span className="font-mono text-[11px] font-medium text-slate-400 dark:text-slate-500">
              {format(new Date(log.createdAt), 'HH:mm:ss.SSS')}
            </span>
          </div>
        </td>

        {/* Action */}
        <td className="px-6 py-5">
          <span
            className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-[10px] font-black tracking-widest uppercase shadow-sm ${actionStyle(log.action)}`}
          >
            {log.action}
          </span>
        </td>

        {/* Entity & Description */}
        <td className="px-6 py-5">
          <div className="flex flex-col justify-center overflow-hidden">
            <div className="mb-1 flex items-center gap-2">
              <div
                className="flex items-center text-slate-400 dark:text-slate-500"
                aria-hidden="true"
              >
                {getEntityIcon(log.entity)}
              </div>
              <span className="truncate font-mono text-xs font-bold text-slate-700 dark:text-slate-200">
                {log.entity || 'system_event'}
              </span>
              {log.entityId && (
                <>
                  <span className="text-slate-300 dark:text-white/10">/</span>
                  <span className="truncate font-mono text-[10px] text-slate-500 dark:text-slate-400">
                    {entityLabels[log.entityId] ?? log.entityId.substring(0, 8)}
                  </span>
                </>
              )}
            </div>
            <p className="truncate text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {log.description ?? 'System recorded action without explicit description.'}
            </p>
          </div>
        </td>

        {/* User */}
        <td className="px-6 py-5 min-w-[200px]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white font-bold text-slate-600 shadow-sm dark:border-white/10 dark:bg-slate-800 dark:text-slate-300"
              aria-hidden="true"
            >
              <span className="text-[10px]">{initials}</span>
            </div>
            <div className="flex flex-col truncate">
              <span className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                {userName}
              </span>
              {log.user?.email && userName !== log.user.email && (
                <span className="truncate text-[10px] font-medium tracking-tight text-slate-500 dark:text-slate-500">
                  {log.user.email}
                </span>
              )}
            </div>
          </div>
        </td>

        {/* IP Address */}
        <td className="px-6 py-5 text-right">
          <div className="flex items-center justify-end gap-3">
            <div className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1 font-mono text-[10px] font-bold text-slate-500 dark:border-white/5 dark:bg-white/3 dark:text-slate-400">
              {log.ipAddress ?? 'INTERNAL'}
            </div>
            <ExternalLink
              className="h-3.5 w-3.5 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-white/20"
              aria-hidden="true"
            />
          </div>
        </td>
      </motion.tr>
    )
  }
)
LogRow.displayName = 'LogRow'

interface AuditLogTableProps {
  logs: AuditLog[]
  total: number
  entityLabels: Record<string, string>
  query?: string
}

export default function AuditLogTable({ logs: initialLogs, total: initialTotal, entityLabels, query }: AuditLogTableProps) {
  const [logs, setLogs] = useState<AuditLog[]>(initialLogs)
  const [total, setTotal] = useState(initialTotal)
  const [loading, setLoading] = useState(false)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)

  // paged is now the raw logs array since the server handles slicing
  const paged = logs

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: perPage.toString(),
        // Add current table filters here if any
      })
      const res = await fetch(`/api/staff/audit-logs?${params}`)
      const data = await res.json()
      setLogs(data.data ?? [])
      setTotal(data.meta?.total ?? 0)
    } finally {
      setLoading(false)
    }
  }

  // Effect to handle page changes
  useEffect(() => {
    // Skip first fetch if it's the initial page and we have initial logs
    const isInitial = page === 1 && perPage === 25
    if (!isInitial) {
      fetchLogs()
    }
  }, [page, perPage])

  function actionStyle(act: string) {
    if (
      act.includes('DELETE') ||
      act.includes('REJECT') ||
      act.includes('SUSPEND') ||
      act.includes('ERROR') ||
      act.includes('FAIL')
    )
      return 'bg-red-500/10 text-red-500 border-red-500/20'
    if (
      act.includes('CREATE') ||
      act.includes('APPROVE') ||
      act.includes('ACTIVATE') ||
      act.includes('SUCCESS')
    )
      return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
    if (act.includes('UPDATE') || act.includes('EDIT'))
      return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    if (act.includes('LOGIN') || act.includes('LOGOUT') || act.includes('AUTH'))
      return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
    if (act.includes('EMAIL') || act.includes('SEND'))
      return 'bg-amber-500/10 text-amber-500 border-amber-500/20'

    return 'bg-slate-500/10 text-slate-500 border-slate-500/20'
  }

  function getEntityIcon(entity: string | null) {
    if (!entity) return <Activity className="h-4 w-4" />
    const e = entity.toLowerCase()
    if (e.includes('user') || e.includes('profile')) return <UserIcon className="h-4 w-4" />
    if (e.includes('email') || e.includes('message')) return <ScrollText className="h-4 w-4" />
    if (e.includes('auth') || e.includes('session')) return <Fingerprint className="h-4 w-4" />
    if (e.includes('system') || e.includes('setting')) return <Cpu className="h-4 w-4" />
    return <Database className="h-4 w-4" />
  }

  function getUserName(log: AuditLog) {
    return log.user?.profile
      ? `${log.user.profile.firstName} ${log.user.profile.lastName}`
      : (log.user?.email ?? 'System')
  }

  function getUserInitials(name: string) {
    if (name === 'System') return 'SY'
    const parts = name.split(' ')
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return name.substring(0, 2).toUpperCase()
  }

  return (
    <>
      <div className="overflow-x-auto rounded-3xl border border-slate-200/60 bg-white shadow-xl dark:border-slate-800/80 dark:bg-[#0A0F1C]">
        <table className="w-full min-w-[1240px] border-collapse">
          {/* Header Row */}
          <thead>
            <tr className="hidden border-b border-slate-100 bg-slate-50/50 text-xs font-bold tracking-wider text-slate-500 uppercase lg:table-row dark:border-slate-800/80 dark:bg-slate-900/50 dark:text-slate-400">
              <th className="px-6 py-4 text-left font-bold" scope="col">
                Timestamp
              </th>
              <th className="px-6 py-4 text-left font-bold" scope="col">
                Action
              </th>
              <th className="px-6 py-4 text-left font-bold" scope="col">
                Entity & Context
              </th>
              <th className="px-6 py-4 text-left font-bold" scope="col">
                User
              </th>
              <th className="px-6 py-4 text-right font-bold" scope="col">
                IP Address
              </th>
            </tr>
          </thead>

          {/* List Body */}
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-5" colSpan={5}>
                    <div className="h-4 w-full rounded bg-slate-100 dark:bg-slate-800" />
                  </td>
                </tr>
              ))
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="flex flex-col items-center justify-center p-16 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                      <ShieldAlert
                        className="h-8 w-8 text-slate-300 dark:text-slate-600"
                        aria-hidden="true"
                      />
                    </div>
                    <p className="font-bold text-slate-500 dark:text-slate-400">
                      No events recorded
                    </p>
                    {query && (
                      <p className="mt-1 text-sm text-slate-400">Try adjusting your filters</p>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paged.map((log, idx) => (
                <LogRow
                  key={log.id}
                  log={log}
                  idx={idx}
                  entityLabels={entityLabels}
                  onSelect={setSelectedLog}
                  actionStyle={actionStyle}
                  getEntityIcon={getEntityIcon}
                  getUserName={getUserName}
                  getUserInitials={getUserInitials}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
      <TablePagination page={page} perPage={perPage} total={total} onPageChange={setPage} onPerPageChange={setPerPage} />

      {/* Glassmorphic Detail Modal */}
      {selectedLog && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md duration-300">
          <div
            className="animate-in zoom-in-95 w-full max-w-2xl overflow-hidden rounded-3xl border border-white/20 bg-white/95 shadow-2xl backdrop-blur-xl duration-300 dark:border-slate-800/80 dark:bg-[#0A0F1C]/95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200/60 bg-slate-50/50 px-8 py-6 dark:border-slate-800/80 dark:bg-slate-900/50">
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl border shadow-inner ${actionStyle(selectedLog.action)}`}
                >
                  {getEntityIcon(selectedLog.entity)}
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight text-aerojet-blue dark:text-white">
                    Event Detail
                  </h2>
                  <p className="mt-0.5 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                    UUID: {selectedLog.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                aria-label="Close details"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-8">
              {/* Context Grid */}
              <div className="mb-8 grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
                {/* Action Block */}
                <div className="col-span-1">
                  <h3 className="mb-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                    Event Action
                  </h3>
                  <span
                    className={`inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-black tracking-wider uppercase ${actionStyle(selectedLog.action)}`}
                  >
                    {selectedLog.action}
                  </span>
                </div>

                {/* Timestamp Block */}
                <div className="col-span-1">
                  <h3 className="mb-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                    Timestamp
                  </h3>
                  <div className="font-mono text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <p>{format(new Date(selectedLog.createdAt), 'yyyy-MM-dd')}</p>
                    <p className="text-slate-500">
                      {format(new Date(selectedLog.createdAt), 'HH:mm:ss.SSS')}
                    </p>
                  </div>
                </div>

                {/* Actor Block */}
                <div className="col-span-full">
                  <h3 className="mb-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                    Actor
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        {getUserInitials(getUserName(selectedLog))}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {getUserName(selectedLog)}
                      </p>
                      <p className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                        {selectedLog.user?.email ?? 'System Process'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Entity Information */}
              <div className="mb-8 rounded-2xl border border-slate-200/60 bg-slate-50/50 p-5 dark:border-slate-800/80 dark:bg-slate-900/50">
                <h3 className="mb-3 text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                  Target Entity
                </h3>
                <div className="flex items-center gap-4 font-mono text-sm text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-slate-400" />
                    <span className="font-semibold">{selectedLog.entity || 'N/A'}</span>
                  </div>
                  <span className="text-slate-300 dark:text-slate-600">/</span>
                  <div className="flex items-center gap-2">
                    <Fingerprint className="h-4 w-4 text-slate-400" />
                    <span>
                      {selectedLog.entityId
                        ? (entityLabels[selectedLog.entityId] ?? selectedLog.entityId)
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Main Log Data */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                    Event Payload / Description
                  </h3>
                  <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400">
                    <ServerCrash className="h-3 w-3" />
                    {selectedLog.ipAddress ?? 'INTERNAL_IP'}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200/60 bg-[#FAFAFA] p-5 font-mono text-sm leading-relaxed text-slate-700 shadow-inner dark:border-slate-800/80 dark:bg-black/40 dark:text-slate-300">
                  {selectedLog.description ?? 'No payload or description provided.'}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end border-t border-slate-200/60 bg-slate-50/50 px-8 py-5 dark:border-slate-800/80 dark:bg-slate-900/50">
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-xl bg-aerojet-blue px-8 py-3 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-[#003875] hover:shadow-lg dark:hover:bg-aerojet-sky"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
