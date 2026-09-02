import { getCertificateByNumber } from '@/lib/certificates/generator'
import { notFound } from 'next/navigation'

interface VerifyPageProps {
  params: Promise<{ certificateId: string }>
}

export default async function VerifyCertificatePage({ params }: VerifyPageProps) {
  const { certificateId } = await params

  if (!certificateId) notFound()

  const certificate = await getCertificateByNumber(certificateId)

  if (!certificate) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Certificate Not Found</h1>
          <p className="mt-2 text-sm text-slate-600">
            No certificate matches <span className="font-mono font-bold">{certificateId}</span>. Verify the certificate number and try again.
          </p>
        </div>
      </main>
    )
  }

  const studentName = certificate.student?.profile
    ? `${certificate.student.profile.firstName} ${certificate.student.profile.lastName}`
    : certificate.student?.email || 'Student'

  const isRevoked = !!certificate.revokedAt
  const status = isRevoked ? 'revoked' : certificate.verified ? 'valid' : 'invalid'
  const issuedAt = certificate.issuedAt
    ? new Date(certificate.issuedAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'Unknown'

  const statusConfig = {
    valid: {
      label: 'Verified — Valid',
      color: 'bg-green-100 text-green-700 border-green-200',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      ),
      iconColor: 'bg-green-100 text-green-600',
    },
    invalid: {
      label: 'Not Verified',
      color: 'bg-amber-100 text-amber-700 border-amber-200',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      ),
      iconColor: 'bg-amber-100 text-amber-600',
    },
    revoked: {
      label: 'Revoked',
      color: 'bg-red-100 text-red-700 border-red-200',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
      ),
      iconColor: 'bg-red-100 text-red-600',
    },
  }

  const s = statusConfig[status]

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${s.iconColor}`}>
            {s.icon}
          </div>
          <span className={`inline-block rounded-full border px-3 py-1 text-xs font-bold ${s.color}`}>
            {s.label}
          </span>
          <h1 className="mt-4 text-2xl font-black text-slate-900">Certificate of Completion</h1>
          <p className="mt-1 font-mono text-xs text-slate-600">{certificate.certificateId}</p>
        </div>

        <dl className="mt-6 divide-y divide-slate-100 rounded-xl border border-slate-100 text-sm">
          <div className="flex justify-between px-4 py-3">
            <dt className="font-bold text-slate-600">Student</dt>
            <dd className="text-slate-900">{studentName}</dd>
          </div>
          {certificate.student?.studentProfile?.studentId && (
            <div className="flex justify-between px-4 py-3">
              <dt className="font-bold text-slate-600">Student ID</dt>
              <dd className="text-slate-900">{certificate.student.studentProfile.studentId}</dd>
            </div>
          )}
          <div className="flex justify-between px-4 py-3">
              <dt className="font-bold text-slate-600">Module</dt>
            <dd className="text-slate-900">{certificate.moduleCode || '—'}</dd>
          </div>
          {certificate.percentage != null && (
            <div className="flex justify-between px-4 py-3">
              <dt className="font-bold text-slate-600">Score</dt>
              <dd className="text-slate-900">{certificate.percentage.toFixed(1)}%</dd>
            </div>
          )}
          <div className="flex justify-between px-4 py-3">
              <dt className="font-bold text-slate-600">Issued</dt>
            <dd className="text-slate-900">{issuedAt}</dd>
          </div>
          {isRevoked && certificate.revokeReason && (
            <div className="flex justify-between px-4 py-3">
              <dt className="font-bold text-slate-600">Revoke Reason</dt>
              <dd className="text-red-600">{certificate.revokeReason}</dd>
            </div>
          )}
        </dl>

        <p className="mt-6 text-center text-xs text-slate-500">
          Verify any certificate at <span className="font-mono">/verify/[certificate-id]</span>
        </p>
      </div>
    </main>
  )
}
