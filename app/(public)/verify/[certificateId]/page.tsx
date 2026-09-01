import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CheckCircle, XCircle, Download, Calendar, Shield } from 'lucide-react'

export const metadata: Metadata = { title: 'Verify Certificate | Aerojet Academy' }

interface VerificationData {
  certificateId: string
  studentName: string
  studentId: string | null
  moduleCode: string | null
  score: number | null
  percentage: number | null
  issuedAt: string
  template: string
  verified: boolean
}

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ certificateId: string }>
}) {
  const { certificateId } = await params

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/certificates/verify/${certificateId}`,
    { next: { revalidate: 60 } }
  )

  if (res.status === 404) notFound()

  let data: VerificationData | null = null
  if (res.ok) {
    const json = await res.json()
    data = json.data
  }

  if (!data) {
    notFound()
  }

  const issuedDate = new Date(data.issuedAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-slate-50 py-12 dark:bg-slate-900">
      <div className="mx-auto max-w-2xl px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Certificate Verification</h1>
          </div>

          <div className="mb-6 flex justify-center">
            {data.verified ? (
              <div className="flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                <CheckCircle className="h-5 w-5" />
                <span className="font-bold">Verified Certificate</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-full bg-red-100 px-4 py-2 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                <XCircle className="h-5 w-5" />
                <span className="font-bold">Unverified Certificate</span>
              </div>
            )}
          </div>

          <div className="space-y-4 border-t border-slate-200 pt-6 dark:border-slate-700">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Certificate ID</p>
              <p className="font-mono text-lg font-bold text-slate-900 dark:text-white">{data.certificateId}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Student Name</p>
              <p className="text-lg font-medium text-slate-900 dark:text-white">{data.studentName}</p>
            </div>

            {data.studentId && (
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Student Number</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">{data.studentId}</p>
              </div>
            )}

            {data.moduleCode && (
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Module Code</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">{data.moduleCode}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-2">
              {data.score != null && (
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Score</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{data.score}</p>
                </div>
              )}
              {data.percentage != null && (
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Percentage</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{data.percentage.toFixed(1)}%</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 pt-4">
              <Calendar className="h-4 w-4 text-slate-400" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Issued on {issuedDate}
              </p>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-6 dark:border-slate-700">
            <p className="text-xs text-slate-400">
              This certificate was issued by Aerojet Aviation Training Academy, an EASA Part-147
              Approved Training Organisation.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
