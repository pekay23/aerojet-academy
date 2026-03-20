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
  CreditCard,
  ShieldCheck,
  KeyRound,
} from 'lucide-react'
import { motion } from 'framer-motion'

interface Applicant {
  id: string
  email: string
  registrationCode?: string | null
  registrationPaid: boolean
  paymentProofUrl?: string | null
  createdAt: string
  profile?: {
    firstName: string
    middleName?: string | null
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
  const [loading, setLoading] = useState<'approve' | 'reject' | 'resend' | null>(null)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  if (!applicant) return null

  const fullName = applicant.profile
    ? [applicant.profile.firstName, applicant.profile.middleName, applicant.profile.lastName]
        .filter(Boolean)
        .join(' ')
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

  const handleResendEmail = async () => {
    setLoading('resend')
    try {
      const res = await fetch(`/api/staff/applicants/${applicant.id}/resend-email`, {
        method: 'POST',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to resend')
      }
      toast.success('Payment details email resent')
    } catch (err: any) {
      toast.error(err.message || 'Failed to resend email')
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed top-0 right-0 bottom-0 z-50 flex w-full max-w-lg flex-col border-l border-slate-100 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
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
          {/* Progress Stepper */}
          <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-6 dark:border-slate-800 dark:bg-slate-900/50">
            <div className="relative flex justify-between">
              {/* Connector line */}
              <div className="absolute top-4 right-0 left-0 h-0.5 bg-slate-200 dark:bg-slate-800" />
              <div
                className="absolute top-4 left-0 h-0.5 bg-[#4c9ded] transition-all duration-500"
                style={{
                  width: applicant.registrationPaid ? '100%' : '50%',
                }}
              />

              {[
                {
                  label: 'Registered',
                  done: true,
                  icon: User,
                },
                {
                  label: 'Payment',
                  done: applicant.registrationPaid,
                  icon: CreditCard,
                },
                {
                  label: 'Approval',
                  done: false,
                  icon: ShieldCheck,
                },
              ].map((step, idx) => (
                <div key={step.label} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                      step.done
                        ? 'border-[#4c9ded] bg-[#002a5c] text-white'
                        : 'border-slate-200 bg-white text-slate-400 dark:border-slate-800 dark:bg-slate-950'
                    }`}
                  >
                    <step.icon className="h-3.5 w-3.5" />
                  </div>
                  <span
                    className={`mt-2 text-[10px] font-black tracking-widest uppercase ${
                      step.done ? 'text-[#002a5c] dark:text-[#4c9ded]' : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Profile Header */}
          <div className="flex items-center gap-4 border-b border-slate-100 px-6 py-6 dark:border-slate-800">
            <div className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[#002a5c] shadow-lg">
              {applicant.profile?.profilePhotoUrl ? (
                <img
                  src={applicant.profile.profilePhotoUrl}
                  alt={fullName}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl font-black text-white">
                  {initials}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight text-slate-800 dark:text-slate-100">
                {fullName}
              </h3>
              <p className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
                <Mail className="h-3 w-3" /> {applicant.email}
              </p>
              {!applicant.registrationPaid && applicant.registrationCode && (
                <button
                  onClick={handleResendEmail}
                  disabled={loading === 'resend'}
                  className="mt-2 flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-[#4c9ded] disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  {loading === 'resend' ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Mail className="h-3 w-3" />
                  )}
                  Resend Payment Details Email
                </button>
              )}
              {applicant.registrationPaid && (
                <button
                  onClick={async () => {
                    setLoading('resend')
                    try {
                      const res = await fetch(
                        `/api/staff/users/${applicant.id}/resend-credentials`,
                        {
                          method: 'POST',
                        }
                      )
                      if (!res.ok) throw new Error()
                      toast.success('Login credentials resent')
                    } catch {
                      toast.error('Failed to resend credentials')
                    } finally {
                      setLoading(null)
                    }
                  }}
                  disabled={loading === 'resend'}
                  className="mt-2 flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-[#4c9ded] disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  {loading === 'resend' ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <KeyRound className="h-3 w-3" />
                  )}
                  Resend Login Credentials
                </button>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-8 px-6 py-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {/* Direct Proof Fallback */}
              {!latestPayment && applicant.paymentProofUrl && (
                <div className="mb-6">
                  <h4 className="mb-3 text-[10px] font-black tracking-widest text-[#002a5c]/40 uppercase dark:text-slate-500">
                    Registration Proof (Manual)
                  </h4>
                  <a
                    href={applicant.paymentProofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4 transition-all hover:bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-slate-900">
                        <CreditCard className="h-5 w-5 text-[#4c9ded]" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                          Payment Document
                        </p>
                        <p className="text-[10px] text-slate-400">View proof of registration fee</p>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-slate-300 transition-colors group-hover:text-[#4c9ded]" />
                  </a>
                </div>
              )}

              {/* Personal Info */}
              <h4 className="mb-4 text-[10px] font-black tracking-widest text-[#002a5c]/40 uppercase dark:text-slate-500">
                Personal Information
              </h4>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
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
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <Icon className="h-4 w-4 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                        {label}
                      </p>
                      <p className="line-clamp-1 text-sm font-bold text-slate-700 dark:text-slate-300">
                        {value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Payment Info */}
            {latestPayment && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h4 className="mb-4 text-[10px] font-black tracking-widest text-[#002a5c]/40 uppercase dark:text-slate-500">
                  Registration Payment
                </h4>
                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                  <div className="flex flex-col gap-3 p-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-[#4c9ded]" />
                        <span className="text-xs font-bold text-slate-500">Registration Fee</span>
                      </div>
                      <span className="text-sm font-black text-[#002a5c] dark:text-[#4c9ded]">
                        {latestPayment.currency} {Number(latestPayment.amount).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                        Method
                      </span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {latestPayment.paymentMethod.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                        Status
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase shadow-sm ${
                          latestPayment.status === 'APPROVED'
                            ? 'bg-emerald-500 text-white'
                            : latestPayment.status === 'REJECTED'
                              ? 'bg-red-500 text-white'
                              : 'bg-amber-500 text-white'
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
                        className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-white py-3 text-xs font-black tracking-widest text-[#002a5c] uppercase shadow-sm transition-all hover:bg-slate-50 dark:bg-slate-900/50 dark:text-[#4c9ded] dark:hover:bg-slate-900"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Verify Payment Proof
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ID Document */}
            {applicant.profile?.idDocumentUrl && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h4 className="mb-4 text-[10px] font-black tracking-widest text-[#002a5c]/40 uppercase dark:text-slate-500">
                  Identification
                </h4>
                <a
                  href={applicant.profile.idDocumentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4 transition-all hover:bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-800/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-slate-950">
                      <FileText className="h-5 w-5 text-slate-400 group-hover:text-[#4c9ded]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        Identity Document
                      </p>
                      <p className="text-[10px] text-slate-400">Passport / National ID Card</p>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-slate-300 transition-colors group-hover:text-[#4c9ded]" />
                </a>
              </motion.div>
            )}

            {/* Reject Form */}
            {showRejectForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <h4 className="mb-3 text-[10px] font-black tracking-widest text-red-500 uppercase">
                  Rejection Reason
                </h4>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Provide a reason for rejection..."
                  rows={3}
                  className="w-full resize-none rounded-2xl border-2 border-red-50 bg-red-50/10 px-4 py-3 text-sm outline-none focus:border-red-500 focus:ring-0 dark:border-red-900/20 dark:bg-red-900/5"
                />
              </motion.div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="space-y-2 border-t border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
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
                className="rounded-xl border border-slate-200 bg-white px-5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
              >
                Cancel Rejection
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
