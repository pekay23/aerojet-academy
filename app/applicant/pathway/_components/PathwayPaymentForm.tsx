'use client'

import { useState } from 'react'
import { UploadDropzone } from '@/lib/uploads/uploadthing'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { CheckCircle2, RefreshCw, Wallet, CircleDot, Circle, AlertCircle } from 'lucide-react'

interface PaymentOption {
  id: string
  label: string
  amount: number
  description: string
  recommended?: boolean
  milestones?: { label: string; amount: number; due: string }[]
  customMin?: number
}

interface Props {
  options: PaymentOption[]
  currency: string
  programmeName: string
  bankDetails: {
    bankName: string | null | undefined
    accountName: string | null | undefined
    accountNumber: string | null | undefined
    swift: string | null | undefined
    branch: string | null | undefined
  }
}

export default function PathwayPaymentForm({
  options,
  currency,
  programmeName,
  bankDetails,
}: Props) {
  const [uploading, setUploading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [selectedOptionId, setSelectedOptionId] = useState<string>('')
  const [customAmount, setCustomAmount] = useState<string>('')

  const router = useRouter()

  // Find by both id and amount to handle duplicate IDs (e.g. WALLET_TOPUP used on top-up page)
  const selectedOption = options.find((o) => o.id === selectedOptionId)

  const getPaymentAmount = () => {
    if (selectedOption?.customMin && customAmount) {
      return parseFloat(customAmount)
    }
    return selectedOption?.amount ?? 0
  }

  const isCustomValid = () => {
    if (!selectedOption?.customMin) return true
    const val = parseFloat(customAmount)
    return !isNaN(val) && val >= selectedOption.customMin
  }

  if (submitted) {
    return (
      <div className="space-y-3 rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-green-500" />
        <p className="font-bold text-green-800">Tuition Payment Proof Submitted</p>
        <p className="text-sm text-green-600">
          Your payment proof for the {selectedOption?.label} has been received. Our team will verify
          it in 1-2 business days. You will be notified once approved.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="mx-auto mt-2 block text-xs text-slate-400 underline hover:text-slate-600"
        >
          <RefreshCw className="mr-1 inline h-3 w-3" />
          Upload a different file
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Step 1: Payment Plan Selection */}
      <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#002a5c] text-xs font-bold text-white">
            1
          </div>
          <h2 className="font-bold text-slate-900 dark:text-slate-100">Choose Your Payment Plan</h2>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Select how you would like to pay for {programmeName}.
        </p>

        <div className="space-y-3">
          {options.map((opt, optIdx) => {
            const isSelected =
              selectedOptionId === opt.id &&
              (!opt.customMin || selectedOptionId === 'CUSTOM_PART_PAYMENT')
            const uniqueKey = `${opt.id}-${optIdx}`
            return (
              <button
                key={uniqueKey}
                type="button"
                onClick={() => {
                  setSelectedOptionId(opt.id)
                  setCustomAmount('')
                }}
                className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                  isSelected
                    ? 'border-[#002a5c] bg-blue-50/50 dark:border-blue-500 dark:bg-blue-900/10'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {isSelected ? (
                      <CircleDot className="h-5 w-5 text-[#002a5c] dark:text-blue-400" />
                    ) : (
                      <Circle className="h-5 w-5 text-slate-300 dark:text-slate-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {opt.label}
                      </span>
                      {opt.recommended && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {opt.description}
                    </p>

                    {!opt.customMin && (
                      <p className="mt-2 text-lg font-black text-[#002a5c] dark:text-blue-400">
                        {currency} {opt.amount.toLocaleString()}
                      </p>
                    )}

                    {/* Payment schedule when selected */}
                    {isSelected && opt.milestones && opt.milestones.length > 0 && (
                      <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 dark:border-slate-700">
                        <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                          Payment Schedule
                        </p>
                        {opt.milestones.map((m, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between rounded-lg bg-white p-2.5 text-sm dark:bg-slate-800"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                                  idx === 0
                                    ? 'bg-[#002a5c] text-white'
                                    : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                }`}
                              >
                                {idx + 1}
                              </div>
                              <div>
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                  {m.label}
                                </span>
                                <span className="ml-2 text-xs text-slate-400">{m.due}</span>
                              </div>
                            </div>
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              {currency} {m.amount.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Custom amount input for military route */}
                    {isSelected && opt.customMin && (
                      <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 dark:border-slate-700">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                          Enter your payment amount
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-500">{currency}</span>
                          <input
                            type="number"
                            value={customAmount}
                            onChange={(e) => setCustomAmount(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            min={opt.customMin}
                            step="0.01"
                            placeholder={`Min. ${opt.customMin.toLocaleString()}`}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold outline-none focus:border-[#002a5c] focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800"
                          />
                        </div>
                        {customAmount && !isCustomValid() && (
                          <p className="flex items-center gap-1 text-xs text-red-500">
                            <AlertCircle className="h-3 w-3" />
                            Minimum amount is {currency} {opt.customMin.toLocaleString()}
                          </p>
                        )}
                        {customAmount && isCustomValid() && (
                          <div className="rounded-lg bg-emerald-50 p-3 text-sm dark:bg-emerald-900/10">
                            <p className="font-bold text-emerald-800 dark:text-emerald-400">
                              Amount to pay now: {currency}{' '}
                              {parseFloat(customAmount).toLocaleString()}
                            </p>
                            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-500">
                              Remaining balance: {currency}{' '}
                              {(opt.amount - parseFloat(customAmount)).toLocaleString()} — payable
                              via wallet before classes begin
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Amount Due Summary */}
        {selectedOption && isCustomValid() && getPaymentAmount() > 0 && (
          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/30 dark:bg-blue-900/10">
            <div className="flex items-start gap-3">
              <Wallet className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
              <div>
                <h3 className="text-sm font-bold text-blue-900 dark:text-blue-400">
                  Amount Due Now: {currency} {getPaymentAmount().toLocaleString()}
                </h3>
                {(selectedOption.id === 'SEAT_CONFIRMATION' ||
                  selectedOption.id === 'CUSTOM_PART_PAYMENT') && (
                  <p className="mt-1 text-xs text-blue-700/80 dark:text-blue-400/60">
                    After your seat is confirmed, you can top up your wallet and pay the remaining
                    milestones before classes begin. Your wallet will be available immediately.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Upload Proof (only visible after plan selection) */}
      {selectedOption && isCustomValid() && getPaymentAmount() > 0 && (
        <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#002a5c] text-xs font-bold text-white">
              2
            </div>
            <h2 className="font-bold text-slate-900 dark:text-slate-100">Upload Payment Proof</h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Upload a screenshot, scan, or PDF of your bank transfer receipt or payment confirmation.
            Accepted formats: JPG, PNG, PDF (max 4MB).
          </p>

          {/* Inline Bank Details for reference */}
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/30 dark:bg-blue-900/20">
            <h4 className="mb-2 text-xs font-bold tracking-wider text-blue-900 uppercase dark:text-blue-300">
              Transfer Funds to:
            </h4>
            <div className="mt-1 grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              <div>
                <span className="block text-[10px] font-bold tracking-tighter text-slate-400 uppercase">
                  Bank
                </span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {bankDetails.bankName || 'FNB Bank'}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold tracking-tighter text-slate-400 uppercase">
                  Account Name
                </span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {bankDetails.accountName || 'AEROJET FOUNDATION'}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold tracking-tighter text-slate-400 uppercase">
                  Account Number
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                  {bankDetails.accountNumber || '—'}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold tracking-tighter text-slate-400 uppercase">
                  Branch
                </span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {bankDetails.branch || 'Airport City Branch'}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold tracking-tighter text-slate-400 uppercase">
                  Swift / BIC
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                  {bankDetails.swift || '—'}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold tracking-tighter text-slate-400 uppercase">
                  Payment Reference
                </span>
                <span className="font-mono font-bold text-blue-600 underline dark:text-blue-400">
                  Enter your Reference Code
                </span>
              </div>
            </div>
          </div>

          <UploadDropzone
            endpoint="paymentProof"
            onUploadBegin={() => setUploading(true)}
            onClientUploadComplete={async (res) => {
              setUploading(false)
              if (!res?.[0]?.url) {
                toast.error('Upload failed — no file URL returned.')
                return
              }

              try {
                const paymentAmount = getPaymentAmount()
                const response = await fetch('/api/applicant/pathway-payment', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    proofUrl: res[0].url,
                    amount: paymentAmount,
                    paymentType: selectedOption?.id,
                    currency,
                  }),
                })
                const data = await response.json()
                if (!response.ok) {
                  toast.error(data.error || 'Failed to submit payment proof.')
                  return
                }
                toast.success('Tuition payment submitted!')
                setSubmitted(true)
                router.refresh()
              } catch {
                toast.error('Network error while saving payment proof.')
              }
            }}
            onUploadError={(error) => {
              setUploading(false)
              toast.error(`Upload error: ${error.message}`)
            }}
            appearance={{
              container:
                'border-2 border-dashed border-slate-200 rounded-xl p-8 cursor-pointer hover:border-[#4c9ded] transition-colors',
              label: 'text-slate-700 font-semibold',
              allowedContent: 'text-slate-400 text-xs',
              button:
                'bg-[#002a5c] text-white font-bold px-6 py-2.5 rounded-xl hover:bg-[#003875] transition-colors',
            }}
          />

          {uploading && (
            <p className="animate-pulse text-center text-sm text-slate-500 dark:text-slate-400">
              Uploading...
            </p>
          )}
        </div>
      )}
    </div>
  )
}
