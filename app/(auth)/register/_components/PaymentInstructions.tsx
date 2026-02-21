'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, CreditCard, Upload, Copy, Check, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function PaymentInstructions({
  fee,
  currency,
  finance,
}: {
  fee: string
  currency: string
  finance: {
    bankName: string
    bankAccountName: string
    bankAccountNumber: string
    bankSwift?: string
  }
}) {
  const searchParams = useSearchParams()
  const registrationCode = searchParams.get('code') ?? ''
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(registrationCode)
    setCopied(true)
    toast.success('Code copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const steps = [
    { label: 'Register', icon: CheckCircle2, done: true },
    { label: 'Pay', icon: CreditCard, done: false, active: true },
    { label: 'Upload Proof', icon: Upload, done: false },
  ]

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="mb-2 flex items-center justify-between">
        {steps.map((step, i) => (
          <div key={step.label} className="flex flex-1 items-center">
            <div className="flex flex-1 flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all ${step.done ? 'bg-green-500 text-white' : step.active ? 'bg-aerojet-blue text-white ring-4 ring-blue-100' : 'bg-gray-200 text-gray-400'}`}
              >
                <step.icon className="h-5 w-5" />
              </div>
              <span
                className={`mt-2 text-[10px] font-bold tracking-wider uppercase ${step.done ? 'text-green-600' : step.active ? 'text-aerojet-blue' : 'text-gray-400'}`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`mx-1 -mt-5 h-0.5 w-full ${step.done ? 'bg-green-400' : 'bg-gray-200'}`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Success Message */}
      <div className="text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-black text-slate-800 dark:text-slate-200">
          Application Submitted!
        </h3>
        <p className="mt-1 text-sm text-gray-500">Check your email for detailed instructions.</p>
      </div>

      {/* Registration Code */}
      <div className="rounded-2xl border-2 border-blue-200 bg-linear-to-br from-blue-50 to-indigo-50 p-5 text-center">
        <p className="mb-2 text-xs font-bold tracking-widest text-blue-600 uppercase">
          Your Registration Code
        </p>
        <div className="flex items-center justify-center gap-3">
          <span className="text-aerojet-blue font-mono text-3xl font-black tracking-[0.15em]">
            {registrationCode}
          </span>
          <button
            onClick={handleCopy}
            className="rounded-lg p-2 transition-colors hover:bg-blue-100"
            title="Copy code"
          >
            {copied ? (
              <Check className="h-5 w-5 text-green-500" />
            ) : (
              <Copy className="h-5 w-5 text-blue-400" />
            )}
          </button>
        </div>
        <p className="mt-2 text-xs text-blue-500">Use this code as your payment reference</p>
      </div>

      {/* Bank Details */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:bg-slate-900">
        <div className="bg-slate-800 px-5 py-3">
          <h4 className="flex items-center gap-2 text-sm font-bold text-white">
            <CreditCard className="h-4 w-4" /> Payment Details
          </h4>
        </div>
        <div className="space-y-3 p-5">
          <p className="text-sm text-gray-600">
            Please pay the registration fee of{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {currency} {fee}
            </strong>{' '}
            to:
          </p>
          <div className="space-y-2 rounded-lg bg-gray-50 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Bank</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {finance.bankName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Account Name</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {finance.bankAccountName || '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Account No.</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {finance.bankAccountNumber}
              </span>
            </div>
            {finance.bankSwift && (
              <div className="flex justify-between">
                <span className="text-gray-500">SWIFT/BIC</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {finance.bankSwift}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2">
              <span className="text-gray-500">Reference</span>
              <span className="text-aerojet-blue font-mono font-bold">{registrationCode}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Upload CTA */}
      <Link
        href={`/upload-proof?code=${registrationCode}`}
        className="bg-aerojet-blue hover:bg-aerojet-sky flex w-full items-center justify-center gap-2 rounded-xl py-4 font-bold text-white shadow-lg transition-all"
      >
        <Upload className="h-5 w-5" /> Upload Payment Proof{' '}
        <ExternalLink className="ml-1 h-4 w-4" />
      </Link>

      <p className="text-center text-xs text-gray-400">
        After uploading, our admissions team will verify your payment and send your portal login
        credentials via email.
      </p>
    </div>
  )
}
