import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { FileText, Download, AlertTriangle } from 'lucide-react'

import { getAuthSession } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { proxyImageUrl } from '@/lib/storage/signed-url'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'
import { getRequestContext } from '@/lib/server/request-context'
import { proxyImageUrl } from '@/lib/storage/signed-url'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'
import { getRequestContext } from '@/lib/server/request-context'

export const metadata: Metadata = {
  title: 'My Documents | Student Portal',
  description: 'Your centralized document vault.',
}

function isImageUrl(url: string): boolean {
  const ext = url.split('.').pop()?.toLowerCase().split('?')[0]
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')
}

export default async function StudentDocumentsPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const documents = await prismaUnfiltered.studentDocument.findMany({
    where: { userId: session.user.id, status: 'ACTIVE' },
    orderBy: [{ type: 'asc' }, { createdAt: 'desc' }],
  })

  const ctx = await getRequestContext()
  await createAuditLog({
    userId: session.user.id,
    action: AuditAction.SYSTEM_UPDATE,
    entity: 'StudentDocument',
    description: `Student viewed ${documents.length} document(s)`,
    changes: { documentIds: documents.map((d) => d.id), count: documents.length },
    ipAddress: ctx.ipAddress ?? undefined,
    userAgent: ctx.userAgent ?? undefined,
  })

  const now = Date.now()

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-blue-800 dark:text-white">
          My Documents
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Your centralized document vault — IDs, medical, qualifications and more.
        </p>
      </div>

      {documents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center dark:border-slate-700 dark:bg-slate-800/50">
          <FileText className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">No documents yet</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Documents uploaded by the Academy will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((d) => {
            const expired = d.expiresAt && d.expiresAt.getTime() < now
            const expiringSoon =
              d.expiresAt &&
              !expired &&
              d.expiresAt.getTime() - now < 1000 * 60 * 60 * 24 * 30
            const hasThumbnail = isImageUrl(d.fileUrl)
            return (
              <div
                key={d.id}
                className="rounded-2xl border border-slate-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
              >
                {hasThumbnail ? (
                  <div className="mb-3 overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-800">
                    <img
                      src={proxyImageUrl(d.fileUrl, 'students')}
                      alt={d.title}
                      className="h-32 w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <FileText className="h-5 w-5" />
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-black tracking-widest text-slate-500 uppercase dark:bg-slate-800">
                      v{d.version}
                    </span>
                  </div>
                )}
                <h3 className="mt-3 line-clamp-1 font-black text-slate-900 dark:text-slate-100" title={d.title}>
                  {d.title}
                </h3>
                <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                  {d.type}
                </p>
                {d.expiresAt && (
                  <p
                    className={`mt-2 flex items-center gap-1 text-xs ${
                      expired
                        ? 'text-red-600'
                        : expiringSoon
                          ? 'text-amber-600'
                          : 'text-slate-400'
                    }`}
                  >
                    {(expired || expiringSoon) && <AlertTriangle className="h-3.5 w-3.5" />}
                    {expired ? 'Expired' : 'Expires'}{' '}
                    {d.expiresAt.toLocaleDateString('en-GB')}
                  </p>
                )}
                <a
                  href={proxyImageUrl(d.fileUrl, 'students')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700"
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </a>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
