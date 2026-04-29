import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Award, Download, Calendar, ExternalLink, AlertCircle } from 'lucide-react'

import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import {
  canAccessFeature,
  getEnrollmentMilestoneStatus,
  getStudentPaymentAccessLevel,
  getStudentStatus,
} from '@/lib/access-control'
import { PaymentRequiredBanner } from '../_components/PaymentRequiredBanner'

export const metadata: Metadata = {
  title: 'Certificates | Student Portal',
  description: 'Download your certificates and credentials.',
}

export default async function CertificatesPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const { isFullTime, isExamOnly, isModular } = await getStudentStatus(session.user.id)
  const hasAccess = await canAccessFeature(session.user.id, 'courses')

  if (isFullTime && !hasAccess) {
    const [milestoneStatus, wallet, accessLevel] = await Promise.all([
      getEnrollmentMilestoneStatus(session.user.id),
      prisma.wallet.findUnique({
        where: { userId: session.user.id },
        select: { availableBalance: true, reservedBalance: true, currency: true },
      }),
      getStudentPaymentAccessLevel(session.user.id),
    ])

    const walletBalance = {
      available: Number(wallet?.availableBalance ?? 0),
      held: Number(wallet?.reservedBalance ?? 0),
      currency: wallet?.currency ?? 'EUR',
    }

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-aerojet-blue sm:text-3xl dark:text-white">
            My Certificates
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            View and download your earned academic certificates.
          </p>
        </div>

        <PaymentRequiredBanner
          accessLevel={accessLevel}
          milestoneStatus={milestoneStatus}
          walletBalance={walletBalance}
        />
      </div>
    )
  }

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
        <h1 className="text-2xl font-black tracking-tight text-aerojet-blue sm:text-3xl dark:text-white">
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
              className="group relative rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-blue-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                <Award className="h-6 w-6" />
              </div>

              <div className="space-y-1">
                <h3 className="line-clamp-1 font-black text-slate-900 dark:text-slate-100" title={cert.exam?.examComponent?.course?.name ?? 'Certificate'}>
                  {cert.exam?.examComponent?.course?.name ?? 'Certificate'}
                </h3>
                <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                  {cert.exam?.examComponent?.course?.code ?? '—'} • Result: {cert.percentage != null ? `${cert.percentage}%` : 'N/A'}
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
                  aria-label={`Download certificate for ${cert.exam?.examComponent?.course?.name ?? 'exam'}`}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-600 transition-colors hover:text-blue-700"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  Download
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center dark:border-slate-700 dark:bg-slate-800/50">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-slate-300 shadow-sm dark:bg-slate-900">
            <Award className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            No certificates yet
          </h3>
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
