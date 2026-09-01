'use client'

import { useState, useTransition } from 'react'
import { Award, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { setCertificateRelease } from '@/app/staff/actions'

interface Props {
  studentId: string
  fundingSource?: string | null
  pathwayCode?: string | null
  initialCertificatesReleased: boolean
  initialDocumentsReleased: boolean
}

export default function CertificateReleaseControl({
  studentId,
  fundingSource,
  pathwayCode,
  initialCertificatesReleased,
  initialDocumentsReleased,
}: Props) {
  const [certs, setCerts] = useState(initialCertificatesReleased)
  const [docs, setDocs] = useState(initialDocumentsReleased)
  const [justification, setJustification] = useState('')
  const [isPending, startTransition] = useTransition()

  const isFT4Y = pathwayCode === 'FULL_TIME_4Y'
  const isScholarship = fundingSource === 'SCHOLARSHIP'

  const save = (next: { certificatesReleased?: boolean; documentsReleased?: boolean }) => {
    if (next.certificatesReleased === true || next.documentsReleased === true) {
      if (!justification.trim()) {
        toast.error('Override justification is required for certificate/document release.')
        return
      }
    }
    startTransition(async () => {
      const res = await setCertificateRelease(studentId, { ...next, overrideJustification: justification })
      if (res.error) {
        toast.error(res.error)
        setCerts(initialCertificatesReleased)
        setDocs(initialDocumentsReleased)
      } else {
        toast.success('Certificate release updated')
      }
    })
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
      <h4 className="mb-1 text-xs font-black tracking-widest text-slate-400 uppercase">
        Certificate Release Override
      </h4>
      <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
        {isScholarship
          ? 'Scholarship student — official EASA certificates are withheld until the full programme is complete and the bond is served. Toggle to force-release.'
          : isFT4Y
            ? '4-year programme — EASA exam certificates release after the first half; remaining documents after OJT. Toggle to release earlier.'
            : 'Force-release controls. Certificates normally release automatically once the Academy uploads them.'}
      </p>
      <div className="mb-4">
        <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Override Justification</label>
        <textarea
          value={justification}
          onChange={(e) => setJustification(e.target.value)}
          rows={2}
          placeholder="Required when releasing certificates/documents..."
          className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:border-aerojet-blue focus:ring-2 focus:ring-aerojet-blue/20"
        />
      </div>
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={certs}
            disabled={isPending}
            onChange={(e) => {
              setCerts(e.target.checked)
              save({ certificatesReleased: e.target.checked })
            }}
            className="h-4 w-4 rounded border-slate-300"
          />
          <Award className="h-4 w-4 text-blue-600" />
          <span className="font-medium text-slate-700 dark:text-slate-200">
            Release official EASA certificates
          </span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={docs}
            disabled={isPending}
            onChange={(e) => {
              setDocs(e.target.checked)
              save({ documentsReleased: e.target.checked })
            }}
            className="h-4 w-4 rounded border-slate-300"
          />
          <FileText className="h-4 w-4 text-emerald-600" />
          <span className="font-medium text-slate-700 dark:text-slate-200">
            Release remaining documents
          </span>
        </label>
      </div>
    </div>
  )
}
