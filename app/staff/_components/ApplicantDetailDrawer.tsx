'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  X,
  User,
  Mail,
  Phone,
  Calendar,
  FileText,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2,
  Copy,
} from 'lucide-react'

interface Applicant {
  id: string
  email: string
  registrationCode?: string | null
  registrationPaid: boolean
  paymentProofUrl?: string | null
  createdAt: string
  profile?: {
    firstName: string
    lastName: string
    phone?: string | null
    nationality?: string | null
    dateOfBirth?: string | null
    idDocumentUrl?: string | null
    profilePhotoUrl?: string | null
  } | null
  payments?: {
    id: string
    amount: number
    currency: string
    paymentMethod: string
    status: string
    proofUrl?: string | null
    createdAt: string
  }[]
}

interface ApplicantDetailDrawerProps {
  applicant: Applicant | null
  onClose: () => void
  onApproved: (id: string) => void
  onRejected: (id: string) => void
}

export default function ApplicantDetailDrawer({
  applicant,
  onClose,
  onApproved,
  onRejected,
}: ApplicantDetailDrawerProps) {
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  if (!applicant) return null

  const fullName = applicant.profile
    ? `${applicant.profile.firstName} ${applicant.profile.lastName}`
    : applicant.email

  const initials = applicant.profile
    ? `${applicant.profile.firstName[0]}${applicant.profile.lastName[0]}`
    : applicant.email[0].toUpperCase()

  const latestPayment = applicant.payments?.[0]

  const handleApprove = async () => {
    setLoading('approve')
    try {
      const res = await fetch(`/api/staff/applicants/${applicant.id}/approve`, { method: 'POST' })
      if (!res.ok) throw new Error()
      toast.success(`${fullName} has been approved`)
      onApproved(applicant.id)
      onClose()
    } catch {
      toast.error('Failed to approve applicant')
    } finally {
      setLoading(null)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason')
      return
    }
    setLoading('reject')
    try {
      const res = await fetch(`/api/staff/applicants/${applicant.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason }),
      })
      if (!res.ok) throw new Error()
      toast.success(`${fullName} has been rejected`)
      onRejected(applicant.id)
      onClose()
    } catch {
      toast.error('Failed to reject applicant')
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed top-0 right-0 bottom-0 z-50 flex w-full max-w-lg flex-col border-l border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-6 py-4">
          <div>
            <h2 className="text-base font-black tracking-tight text-[#002a5c] uppercase">
              Applicant Review
            </h2>
            {applicant.registrationCode && (
              <p className="mt-0.5 flex items-center gap-1 font-mono text-xs text-slate-400">
                {applicant.registrationCode}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(applicant.registrationCode!)
                    toast.success('Copied')
                  }}
                  className="text-slate-300 hover:text-slate-500 dark:text-slate-400"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Profile Header */}
          <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 px-6 py-5">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#002a5c] text-lg font-black text-white">
              {applicant.profile?.profilePhotoUrl ? (
                <img
                  src={applicant.profile.profilePhotoUrl}
                  alt={fullName}
                  className="h-full w-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-200">{fullName}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{applicant.email}</p>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-black tracking-widest uppercase ${
                    applicant.registrationPaid
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {applicant.registrationPaid ? 'Fee Paid' : 'Fee Pending'}
                </span>
                {!applicant.registrationPaid && applicant.paymentProofUrl && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black tracking-widest text-blue-700 uppercase">
                    Proof Uploaded
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-5 px-6 py-5">
            {/* Direct Proof Fallback */}
            {!latestPayment && applicant.paymentProofUrl && (
              <div>
                <h4 className="mb-3 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Quick Proof View (Legacy/Manual)
                </h4>
                <a
                  href={applicant.paymentProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-bold text-[#4c9ded] hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View Uploaded Proof
                </a>
              </div>
            )}
            {/* Personal Info */}
            <div>
              <h4 className="mb-3 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Personal Information
              </h4>
              <div className="space-y-3">
                {[
                  { icon: Mail, label: 'Email', value: applicant.email },
                  { icon: Phone, label: 'Phone', value: applicant.profile?.phone || '—' },
                  {
                    icon: User,
                    label: 'Nationality',
                    value: applicant.profile?.nationality || '—',
                  },
                  {
                    icon: Calendar,
                    label: 'Date of Birth',
                    value: applicant.profile?.dateOfBirth
                      ? new Date(applicant.profile.dateOfBirth).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : '—',
                  },
                  {
                    icon: Calendar,
                    label: 'Registered',
                    value: new Date(applicant.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    }),
                  },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                      <Icon className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                        {label}
                      </p>
                      <p className="text-sm font-medium text-slate-700">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Info */}
            {latestPayment && (
              <div>
                <h4 className="mb-3 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Registration Payment
                </h4>
                <div className="space-y-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4">
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Amount</span>
                    <span className="text-xs font-black text-[#002a5c]">
                      {latestPayment.currency} {Number(latestPayment.amount).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Method</span>
                    <span className="text-xs font-bold text-slate-700">
                      {latestPayment.paymentMethod.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Status</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                        latestPayment.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-700'
                          : latestPayment.status === 'REJECTED'
                            ? 'bg-red-100 text-red-600'
                            : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {latestPayment.status}
                    </span>
                  </div>
                  {latestPayment.proofUrl && (
                    <a
                      href={latestPayment.proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 pt-1 text-xs font-bold text-[#4c9ded] hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View Payment Proof
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* ID Document */}
            {applicant.profile?.idDocumentUrl && (
              <div>
                <h4 className="mb-3 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  ID Document
                </h4>
                <a
                  href={applicant.profile.idDocumentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm font-bold text-[#4c9ded] hover:underline"
                >
                  <FileText className="h-4 w-4" />
                  View Document
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            )}

            {/* Reject Form */}
            {showRejectForm && (
              <div>
                <h4 className="mb-3 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Rejection Reason
                </h4>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Provide a reason for rejection..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-300"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-6 py-4">
          {showRejectForm ? (
            <div className="flex gap-2">
              <button
                onClick={handleReject}
                disabled={!!loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 py-3 text-xs font-black text-white transition-all hover:bg-red-600 disabled:opacity-50"
              >
                {loading === 'reject' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                Confirm Rejection
              </button>
              <button
                onClick={() => {
                  setShowRejectForm(false)
                  setRejectionReason('')
                }}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleApprove}
                disabled={!!loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#002a5c] py-3 text-xs font-black text-white transition-all hover:bg-[#4c9ded] disabled:opacity-50"
              >
                {loading === 'approve' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Approve Applicant
              </button>
              <button
                onClick={() => setShowRejectForm(true)}
                disabled={!!loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-50 py-3 text-xs font-black text-red-600 transition-all hover:bg-red-100 disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
