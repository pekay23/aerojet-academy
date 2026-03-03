import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma/client'
import { format } from 'date-fns'
import { ScrollText, User, Tag, Clock } from 'lucide-react'

export default async function AuditLogsPage() {
  const session = await getAuthSession()
  if (!session || (session.user.role !== 'STAFF' && session.user.role !== 'ADMIN')) {
    redirect('/login')
  }

  const logs = await prisma.auditLog.findMany({
    take: 50,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        include: {
          profile: true,
        },
      },
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-[#002a5c] sm:text-3xl dark:text-white">
          System Audit Logs
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Track all administrative actions, overrides, and critical system changes.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {logs.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <ScrollText className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p>No audit logs found.</p>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="p-6 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-bold uppercase ${
                          log.action.includes('OVERRIDE')
                            ? 'bg-purple-100 text-purple-700'
                            : log.action.includes('REPORT')
                              ? 'bg-blue-100 text-blue-700'
                              : log.action.includes('WITHDRAW')
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {log.action.replace(/_/g, ' ')}
                      </span>
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {log.entity} {log.entityId && `#${log.entityId.substring(0, 8)}`}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{log.description}</p>
                    {log.changes && Object.keys(log.changes as any).length > 0 && (
                      <div className="mt-2 rounded-lg bg-slate-100 p-2 font-mono text-xs dark:bg-slate-800">
                        <pre>{JSON.stringify(log.changes, null, 2)}</pre>
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                      <User className="h-3 w-3" />
                      {log.user?.profile?.firstName
                        ? `${log.user.profile.firstName} ${log.user.profile.lastName}`
                        : log.user?.email || 'System'}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      {format(log.createdAt, 'MMM d, yyyy HH:mm:ss')}
                    </div>
                    {log.ipAddress && (
                      <div className="text-[10px] text-slate-400">IP: {log.ipAddress}</div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
