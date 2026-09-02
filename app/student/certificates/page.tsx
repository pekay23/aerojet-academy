import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Award, Download, Calendar, AlertCircle, Lock, FileText } from 'lucide-react'
import { format } from 'date-fns'

import { getAuthSession } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { SortableTh } from '@/components/ui/sortable-th'
import { buildOrderBy } from '@/lib/utils/build-order-by'
import {
  canAccessFeature,
  getEnrollmentMilestoneStatus,
  getStudentPaymentAccessLevel,
  getStudentStatus,
} from '@/lib/access-control'
import { getCertificateEligibility } from '@/lib/certificates/eligibility'
import { PaymentRequiredBanner } from '../_components/PaymentRequiredBanner'

type SortKey = 'module' | 'exam' | 'score' | 'result' | 'date'

const ALLOWED_SORT_KEYS = {
  module: 'moduleCode',
  exam: 'exam.examComponent.course.name',
  score: 'percentage',
  result: 'passed',
  date: 'exam.examDate',
} as const satisfies Record<SortKey, string>

export const metadata: Metadata = {
  title: 'Certificates | Student Portal',
  description: 'Download your certificates and credentials.',
}
export const dynamic = 'force-dynamic'

export default async function CertificatesPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; order?: string }>
}) {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const params = await searchParams
  const orderBy = buildOrderBy<SortKey>(params, ALLOWED_SORT_KEYS, { createdAt: 'desc' })

  const { isFullTime } = await getStudentStatus(session.user.id)
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
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-blue-800 dark:text-white">
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

  const [eligibility, examResults] = await Promise.all([
    getCertificateEligibility(session.user.id),
    prismaUnfiltered.examResult.findMany({
      where: { userId: session.user.id },
      include: {
        exam: { include: { examComponent: { include: { course: true } } } },
      },
      orderBy: buildOrderBy<SortKey>(params, ALLOWED_SORT_KEYS, { createdAt: 'desc' }),
    }),
  ])

  const officialCertificates = eligibility.officialCertificatesAvailable
    ? examResults.filter((r) => r.certificateUrl != null)
    : []

  const courseName = (r: (typeof examResults)[number]) =>
    r.exam?.examComponent?.course?.name ?? r.moduleCode ?? 'Exam'
  const courseCode = (r: (typeof examResults)[number]) =>
    r.exam?.examComponent?.course?.code ?? r.moduleCode ?? '—'

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-blue-800 dark:text-white">
          My Certificates
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          View and download your earned academic certificates.
        </p>
      </div>

      {/* Eligibility / status banner */}
      <div
        className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${
          eligibility.mode === 'OFFICIAL'
            ? 'border-blue-100 bg-blue-50 text-blue-800 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-200'
            : 'border-amber-100 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200'
        }`}
      >
        {eligibility.mode === 'OFFICIAL' ? (
          <Award className="mt-0.5 h-5 w-5 shrink-0" />
        ) : (
          <Lock className="mt-0.5 h-5 w-5 shrink-0" />
        )}
        <p>{eligibility.reason}</p>
      </div>

      {/* Official EASA certificates */}
      {eligibility.officialCertificatesAvailable && (
        <section className="space-y-4">
          <h2 className="text-xs font-black tracking-widest text-slate-400 uppercase">
            Official EASA Certificates
          </h2>
          {officialCertificates.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {officialCertificates.map((cert) => (
                <div
                  key={cert.id}
                  className="group relative rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-blue-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                    <Award className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h3
                      className="line-clamp-1 font-black text-slate-900 dark:text-slate-100"
                      title={courseName(cert)}
                    >
                      {courseName(cert)}
                    </h3>
                    <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                      {courseCode(cert)} • Result:{' '}
                      {cert.percentage != null ? `${cert.percentage}%` : 'N/A'}
                    </p>
                  </div>
                  <div className="mt-6 flex items-center justify-between border-t border-slate-50 pt-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {(cert.certificateIssued ?? cert.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <a
                      href={cert.certificateUrl!}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Download certificate for ${courseName(cert)}`}
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
                No certificates uploaded yet
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                You are eligible to receive certificates. They will appear here once the Academy
                uploads and links them.
              </p>
              <div className="mt-6">
                <AlertCircle className="mr-2 inline-block h-4 w-4 align-text-bottom text-amber-500" />
                <span className="text-xs text-slate-400">
                  Certificates are usually issued within 5-7 business days after passing an exam.
                </span>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Academy-generated transcript / exam scores */}
      {eligibility.showAcademyTranscript && (
        <section className="space-y-4">
          <div>
            <h2 className="text-xs font-black tracking-widest text-slate-400 uppercase">
              Academy Transcript &amp; Exam Scores
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Academy-issued record of exams written. This is not an official EASA certificate.
            </p>
          </div>
          {examResults.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-left dark:border-slate-800 dark:bg-slate-900/50">
                    <SortableTh sortKey="module" label="Module" />
                    <SortableTh sortKey="exam" label="Exam" />
                    <SortableTh sortKey="score" label="Score" align="center" />
                    <SortableTh sortKey="result" label="Result" align="center" />
                    <SortableTh sortKey="date" label="Date" align="center" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {examResults.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {courseCode(r)}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {courseName(r)}
                      </td>
                      <td className="px-4 py-3 text-center tabular-nums font-mono font-black">
                        {r.percentage != null ? `${r.percentage}%` : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                            r.passed
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {r.passed ? 'Pass' : 'Fail'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center tabular-nums text-xs text-slate-500">
                        {format(r.exam?.examDate ?? r.createdAt, 'MMM d, yyyy')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center dark:border-slate-700 dark:bg-slate-800/50">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-slate-300 shadow-sm dark:bg-slate-900">
                <FileText className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                No exam scores yet
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                Your Academy transcript will populate here as the Academy uploads your exam
                results.
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
