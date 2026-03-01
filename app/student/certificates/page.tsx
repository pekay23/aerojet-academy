import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Award, Download, Calendar, ExternalLink, AlertCircle } from 'lucide-react'

import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'

export const metadata: Metadata = { title: 'Certificates | Student Portal' }

export default async function CertificatesPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const certificates = await prisma.examResult.findMany({
    where: {
      userId: session.user.id,
      certificateUrl: { not: null },
    },
    include: {
      exam: {
        include: { examComponent: { include: { course: true } } },
      },
    },
    orderBy: { certificateIssued: 'desc' },
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          My Certificates
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          View and download your earned academic certificates.
        </p>
      </div>

      {certificates.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="group relative rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                <Award className="h-6 w-6" />
              </div>

              <div className="space-y-1">
                <h3 className="line-clamp-1 font-black text-slate-900 dark:text-slate-100">{cert.exam.examComponent.course.name}</h3>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  {cert.exam.examComponent.course.code} • Result: {cert.percentage.toString()}%
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-slate-50 pt-4">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    {cert.certificateIssued?.toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <a
                  href={cert.certificateUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-600 transition-colors hover:text-blue-700"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white dark:bg-slate-900 text-slate-300 shadow-sm">
            <Award className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">No certificates yet</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Once you pass your exams and certificates are issued, they will appear here for you to
            view and download.
          </p>
          <div className="mt-6">
            <AlertCircle className="mr-2 inline-block h-4 w-4 align-text-bottom text-amber-500" />
            <span className="text-xs text-slate-400">
              Certificates are usually issued within 5-7 business days after passing an exam.
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

