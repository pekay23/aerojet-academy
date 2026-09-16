'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, CreditCard, Upload, Copy, Check, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import PaymentMethodsDisplay from '@/components/shared/PaymentMethodsDisplay'

interface PaymentMethodData {
  id: string
  type: string
  label: string
  currency: string
  bankName: string | null
  bankAccountName: string | null
  bankAccountNumber: string | null
  bankSwiftCode: string | null
  bankBranch: string | null
  momoProvider: string | null
  momoNumber: string | null
  momoMerchantCode: string | null
  momoAccountName: string | null
}

export default function PaymentInstructions({
  fee,
  currency,
  paymentMethods,
  finance,
}: {
  fee: string
  currency: string
  paymentMethods?: PaymentMethodData[]
  finance?: {
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

  // Build methods array — prefer paymentMethods prop, fall back to legacy finance prop
  const methods: PaymentMethodData[] =
    paymentMethods && paymentMethods.length > 0
      ? paymentMethods
      : finance
        ? [
            {
              id: 'legacy',
              type: 'BANK_TRANSFER',
              label: finance.bankName || 'Bank Transfer',
              currency,
              bankName: finance.bankName,
              bankAccountName: finance.bankAccountName,
              bankAccountNumber: finance.bankAccountNumber,
              bankSwiftCode: finance.bankSwift || null,
              bankBranch: null,
              momoProvider: null,
              momoNumber: null,
              momoMerchantCode: null,
              momoAccountName: null,
            },
          ]
        : []

  const steps = [
    { label: 'Register', icon: CheckCircle2, done: true },
    { label: 'Pay', icon: CreditCard, done: false, active: true },
    { label: 'Upload Proof', icon: Upload, done: false },
  ]

  return (
    <div className="space-y-6">
      {/* Progress Stepper */}
      <div className="relative mb-8 flex items-center justify-between px-2">
        <div className="absolute top-5 left-0 h-0.5 w-full bg-gray-100" />
        {steps.map((step, i) => (
          <div key={step.label} className="relative z-10 flex flex-1 flex-col items-center">
            {i > 0 && steps[i - 1].done && (
              <div
                className={`absolute top-5 right-1/2 h-0.5 w-full -translate-x-full ${step.active || step.done ? 'bg-green-400' : 'bg-gray-100'}`}
                style={{ width: '100.5%' }}
              />
            )}
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold shadow-sm transition-all ${
                step.done
                  ? 'bg-green-500 text-white'
                  : step.active
                    ? 'bg-aerojet-blue text-white ring-4 ring-blue-50'
                    : 'border-2 border-gray-100 bg-white text-gray-300'
              }`}
            >
              <step.icon className="h-5 w-5" />
            </div>
            <span
              className={`mt-3 text-[10px] font-bold tracking-widest uppercase transition-colors ${
                step.done ? 'text-green-600' : step.active ? 'text-aerojet-blue' : 'text-gray-400'
              }`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* Success Message */}
      <div className="text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-black text-slate-800">Application Submitted!</h3>
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

      {/* Fee Info */}
      <p className="text-center text-sm text-gray-600">
        Please pay the registration fee of{' '}
        <strong className="text-slate-800">
          {currency} {fee}
        </strong>{' '}
        using one of the methods below:
      </p>

      {/* Payment Methods */}
      <PaymentMethodsDisplay
        methods={methods}
        reference={registrationCode}
        referenceLabel="Registration Code"
      />

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
