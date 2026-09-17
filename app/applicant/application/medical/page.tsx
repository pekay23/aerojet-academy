'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Stethoscope,
  Upload,
  CheckCircle2,
  Clock,
  FileText,
  AlertTriangle,
  Loader2,
  ExternalLink,
} from 'lucide-react'

interface MedicalDoc {
  id: string
  status: string
  documentType: { name: string }
  fileUpload: { url: string; filename: string }
}

interface MedicalData {
  stage: string
  medicalStatus: string | null
  medicalClearedAt: string | null
  medicalFacility: string | null
  medicalNotes: string | null
  documents: MedicalDoc[]
  medicalDocTypes: { id: string; name: string; slug: string }[]
  applicationId: string
}

export default function MedicalPage() {
  const [data, setData] = useState<MedicalData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/applicant/medical')
      const json = await res.json()
      if (json.data) setData(json.data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

   
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData() }, [fetchData])

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/applicant/medical/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Medical documents submitted for review')
        fetchData()
      } else {
        toast.error(json.error || 'Failed to submit')
      }
    } catch {
      toast.error('An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-aerojet-blue" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Stethoscope className="mx-auto mb-4 h-12 w-12 text-slate-300" />
        <h2 className="text-lg font-black text-slate-600 dark:text-slate-300">
          Medical Stage Not Active
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          You haven&apos;t reached the medical examination stage yet.
        </p>
      </div>
    )
  }

  const isCleared = data.stage === 'MEDICAL_CLEARED' || data.medicalStatus === 'CLEARED'
  const isSubmitted = data.stage === 'MEDICAL_SUBMITTED'
  const isPending = data.stage === 'MEDICAL_PENDING'

  return (
    <div className="mx-auto max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-aerojet-blue dark:text-white">
          Medical Examination
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Complete your medical examination at an approved facility and upload your documents.
        </p>
      </div>

      {/* Status Card */}
      <div className={`rounded-2xl border p-6 ${
        isCleared
          ? 'border-green-200 bg-green-50 dark:border-green-800/50 dark:bg-green-900/10'
          : isSubmitted
            ? 'border-blue-200 bg-blue-50 dark:border-blue-800/50 dark:bg-blue-900/10'
            : 'border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-900/10'
      }`}>
        <div className="flex items-start gap-4">
          <div className={`rounded-xl p-3 ${
            isCleared ? 'bg-green-200 dark:bg-green-800/40' :
            isSubmitted ? 'bg-blue-200 dark:bg-blue-800/40' :
            'bg-amber-200 dark:bg-amber-800/40'
          }`}>
            {isCleared ? (
              <CheckCircle2 className="h-6 w-6 text-green-700 dark:text-green-300" />
            ) : isSubmitted ? (
              <Clock className="h-6 w-6 text-blue-700 dark:text-blue-300" />
            ) : (
              <Stethoscope className="h-6 w-6 text-amber-700 dark:text-amber-300" />
            )}
          </div>
          <div>
            <h2 className={`text-lg font-bold ${
              isCleared ? 'text-green-800 dark:text-green-200' :
              isSubmitted ? 'text-blue-800 dark:text-blue-200' :
              'text-amber-800 dark:text-amber-200'
            }`}>
              {isCleared
                ? 'Medical Examination Cleared'
                : isSubmitted
                  ? 'Documents Under Review'
                  : 'Medical Documents Required'}
            </h2>
            <p className={`mt-1 text-sm ${
              isCleared ? 'text-green-600 dark:text-green-400' :
              isSubmitted ? 'text-blue-600 dark:text-blue-400' :
              'text-amber-600 dark:text-amber-400'
            }`}>
              {isCleared
                ? `You have been cleared for enrollment${data.medicalFacility ? ` by ${data.medicalFacility}` : ''}.`
                : isSubmitted
                  ? 'Your medical documents are being reviewed by the admissions team.'
                  : 'Please visit an approved medical facility and upload the required documents below.'}
            </p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      {isPending && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-900 dark:text-white">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Required Steps
          </h3>
          <ol className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-aerojet-blue text-xs font-bold text-white">1</span>
              <span>Visit an approved medical facility for a complete aviation medical examination (Class 1 or Class 2 as applicable).</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-aerojet-blue text-xs font-bold text-white">2</span>
              <span>Obtain your signed medical certificate and any supporting lab reports.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-aerojet-blue text-xs font-bold text-white">3</span>
              <span>Upload the documents using the &quot;Documents&quot; page in the sidebar — select the medical document type.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-aerojet-blue text-xs font-bold text-white">4</span>
              <span>Click the <strong>&quot;Submit for Review&quot;</strong> button below once all documents are uploaded.</span>
            </li>
          </ol>
        </div>
      )}

      {/* Uploaded Documents */}
      {data.documents.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 font-bold text-slate-900 dark:text-white">Uploaded Medical Documents</h3>
          <div className="space-y-2">
            {data.documents.map(doc => (
              <div
                key={doc.id}
                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-aerojet-blue dark:text-aerojet-sky" />
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{doc.documentType.name}</p>
                    <p className="text-xs text-slate-500">{doc.fileUpload.filename}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    doc.status === 'APPROVED'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      : doc.status === 'REJECTED'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                  }`}>{doc.status}</span>
                  <a
                    href={doc.fileUpload.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded p-1 text-slate-400 hover:text-aerojet-blue"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit Button */}
      {isPending && (
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={submitting || data.documents.length === 0}
            className="flex items-center gap-2 rounded-xl bg-aerojet-blue px-8 py-3 font-bold text-white hover:bg-aerojet-blue/90 disabled:opacity-50 dark:bg-aerojet-sky"
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Upload className="h-5 w-5" />
            )}
            Submit for Review
          </button>
        </div>
      )}
    </div>
  )
}
