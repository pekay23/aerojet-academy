'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Stethoscope,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  FileText,
  ExternalLink,
  Clock,
  AlertTriangle,
} from 'lucide-react'

interface MedicalApp {
  id: string
  stage: string
  medicalStatus: string | null
  medicalNotes: string | null
  medicalFacility: string | null
  medicalClearedAt: string | null
  user: {
    id: string
    email: string
    name: string | null
    profile: { firstName: string; lastName: string; phone: string | null } | null
  }
  documents: {
    id: string
    status: string
    documentType: { name: string }
    fileUpload: { url: string; filename: string }
  }[]
}

const STAGE_BADGES: Record<string, { label: string; color: string; icon: any }> = {
  MEDICAL_PENDING: { label: 'Awaiting Docs', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300', icon: Clock },
  MEDICAL_SUBMITTED: { label: 'Ready for Review', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', icon: FileText },
  MEDICAL_CLEARED: { label: 'Cleared', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', icon: CheckCircle2 },
}

export default function MedicalReviewDashboard({ applications }: { applications: MedicalApp[] }) {
  const router = useRouter()
  const [filter, setFilter] = useState<string>('ALL')
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [facility, setFacility] = useState('')
  const [loading, setLoading] = useState(false)

  const filtered = filter === 'ALL' ? applications : applications.filter(a => a.stage === filter)

  const handleDecision = async (appId: string, decision: 'CLEARED' | 'FAILED' | 'EXEMPTED') => {
    if (decision === 'FAILED' && !notes.trim()) {
      alert('Please provide notes explaining why the medical review failed')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/staff/admissions/medical/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: appId, decision, notes, facility }),
      })
      const data = await res.json()
      if (data.success) {
        setReviewingId(null)
        setNotes('')
        setFacility('')
        router.refresh()
      } else {
        alert(data.error || 'Failed to process medical review')
      }
    } catch {
      alert('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const pendingCount = applications.filter(a => a.stage === 'MEDICAL_PENDING').length
  const submittedCount = applications.filter(a => a.stage === 'MEDICAL_SUBMITTED').length
  const clearedCount = applications.filter(a => a.stage === 'MEDICAL_CLEARED').length

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/50 dark:bg-amber-900/10">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-200 p-2 dark:bg-amber-800/50">
              <Clock className="h-5 w-5 text-amber-700 dark:text-amber-300" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-800 dark:text-amber-200">{pendingCount}</p>
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Awaiting Documents</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800/50 dark:bg-blue-900/10">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-200 p-2 dark:bg-blue-800/50">
              <FileText className="h-5 w-5 text-blue-700 dark:text-blue-300" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{submittedCount}</p>
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Ready for Review</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800/50 dark:bg-green-900/10">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-200 p-2 dark:bg-green-800/50">
              <CheckCircle2 className="h-5 w-5 text-green-700 dark:text-green-300" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-800 dark:text-green-200">{clearedCount}</p>
              <p className="text-xs font-medium text-green-600 dark:text-green-400">Cleared</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'ALL', label: `All (${applications.length})` },
          { key: 'MEDICAL_SUBMITTED', label: `To Review (${submittedCount})` },
          { key: 'MEDICAL_PENDING', label: `Pending (${pendingCount})` },
          { key: 'MEDICAL_CLEARED', label: `Cleared (${clearedCount})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
              filter === tab.key
                ? 'bg-aerojet-blue text-white dark:bg-aerojet-sky'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
            <Stethoscope className="mx-auto mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" />
            <p className="text-slate-500">No applications in this category.</p>
          </div>
        ) : (
          filtered.map(app => {
            const badge = STAGE_BADGES[app.stage] || STAGE_BADGES.MEDICAL_PENDING
            const BadgeIcon = badge.icon
            const isReviewing = reviewingId === app.id
            const fullName = app.user.profile
              ? `${app.user.profile.firstName} ${app.user.profile.lastName}`
              : app.user.email

            return (
              <div
                key={app.id}
                className="rounded-xl border border-slate-200 bg-white transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                      <Stethoscope className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{fullName}</h3>
                      <p className="text-sm text-slate-500">{app.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${badge.color}`}>
                      <BadgeIcon className="h-3.5 w-3.5" />
                      {badge.label}
                    </span>
                    {app.stage === 'MEDICAL_SUBMITTED' && !isReviewing && (
                      <button
                        onClick={() => setReviewingId(app.id)}
                        className="rounded-lg bg-aerojet-blue px-4 py-2 text-sm font-bold text-white hover:bg-aerojet-blue/90"
                      >
                        Review
                      </button>
                    )}
                  </div>
                </div>

                {/* Documents */}
                {app.documents.length > 0 && (
                  <div className="border-t border-slate-100 px-5 py-3 dark:border-slate-800">
                    <p className="mb-2 text-xs font-bold text-slate-500">Uploaded Documents</p>
                    <div className="flex flex-wrap gap-2">
                      {app.documents.map(doc => (
                        <a
                          key={doc.id}
                          href={doc.fileUpload.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          {doc.documentType.name}
                          <ExternalLink className="h-3 w-3 text-slate-400" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Review Form */}
                {isReviewing && (
                  <div className="border-t border-aerojet-blue/20 bg-aerojet-blue/5 p-5 dark:border-aerojet-sky/20 dark:bg-aerojet-sky/5">
                    <h4 className="mb-4 font-bold text-aerojet-blue dark:text-aerojet-sky">Medical Review Decision</h4>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">Facility Name</label>
                        <input
                          type="text"
                          className="w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                          value={facility}
                          onChange={e => setFacility(e.target.value)}
                          placeholder="e.g. Korle-Bu Teaching Hospital"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">Notes</label>
                        <input
                          type="text"
                          className="w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                          value={notes}
                          onChange={e => setNotes(e.target.value)}
                          placeholder="Any additional notes..."
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => handleDecision(app.id, 'CLEARED')}
                        disabled={loading}
                        className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-4 w-4" /> Clear
                      </button>
                      <button
                        onClick={() => handleDecision(app.id, 'EXEMPTED')}
                        disabled={loading}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        <ShieldCheck className="h-4 w-4" /> Exempt
                      </button>
                      <button
                        onClick={() => handleDecision(app.id, 'FAILED')}
                        disabled={loading}
                        className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" /> Fail
                      </button>
                      <button
                        onClick={() => { setReviewingId(null); setNotes(''); setFacility(''); }}
                        className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Existing clearance info */}
                {app.medicalClearedAt && (
                  <div className="border-t border-green-200 bg-green-50/50 px-5 py-3 text-sm text-green-800 dark:border-green-800/50 dark:bg-green-900/10 dark:text-green-300">
                    Cleared on {new Date(app.medicalClearedAt).toLocaleDateString()}
                    {app.medicalFacility && ` — ${app.medicalFacility}`}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
