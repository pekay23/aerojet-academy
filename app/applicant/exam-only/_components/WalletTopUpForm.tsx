'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Wallet,
  CircleDot,
  Circle,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Building,
  Smartphone,
  CreditCard,
  Upload,
  ArrowRight,
  PiggyBank,
} from 'lucide-react'
import { UploadDropzone } from '@/lib/uploads/uploadthing'

interface PaymentMethod {
  id: string
  name: string
  type: string
  instructions?: string
  details?: Record<string, string>
}

interface WalletTopUpFormProps {
  minAmount: number
  currency?: string
  paymentMethods: PaymentMethod[]
}

const FIXED_AMOUNTS = [300, 500, 1000, 2000]

export default function WalletTopUpForm({
  minAmount,
  currency = 'EUR',
  paymentMethods = [],
}: WalletTopUpFormProps) {
  const router = useRouter()
  const [step, setStep] = useState<'amount' | 'payment' | 'success'>('amount')
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [selectedMethodId, setSelectedMethodId] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [proofUrl, setProofUrl] = useState<string>('')

  const getAmount = (): number => {
    if (selectedAmount !== null) return selectedAmount
    const val = parseFloat(customAmount)
    return isNaN(val) ? 0 : val
  }

  const isCustomValid = (): boolean => {
    const val = parseFloat(customAmount)
    return !isNaN(val) && val >= minAmount
  }

  const isAmountSelected = (): boolean => {
    if (selectedAmount !== null) return true
    return !!customAmount && isCustomValid()
  }

  const selectedMethod = paymentMethods.find((m) => m.id === selectedMethodId)

  const handleAmountContinue = () => {
    if (!isAmountSelected()) {
      toast.error('Please select or enter an amount')
      return
    }
    if (!selectedMethodId && paymentMethods.length > 0) {
      setSelectedMethodId(paymentMethods[0].id)
    }
    setStep('payment')
  }

  const handleUploadComplete = async (res: { url: string }[]) => {
    if (res && res[0]?.url) {
      setProofUrl(res[0].url)
      setUploading(true)

      try {
        const apiRes = await fetch('/api/applicant/exam-only/top-up', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: getAmount(),
            paymentMethodId: selectedMethodId,
            proofUrl: res[0].url,
          }),
        })

        const data = await apiRes.json()

        if (!apiRes.ok) {
          if (data.error && data.error.includes('pending')) {
            toast.error('You already have a pending top-up. Please wait for it to be processed.')
          } else {
            toast.error(data.error || 'Failed to submit payment')
          }
          setProofUrl('')
          return
        }

        toast.success('Payment submitted successfully!')
        setStep('success')
      } catch (error) {
        console.error('Payment error:', error)
        toast.error('Network error. Please try again.')
      } finally {
        setUploading(false)
      }
    }
  }

  const handleBack = () => {
    if (step === 'payment') {
      setStep('amount')
    }
  }

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'BANK_TRANSFER':
        return <Building className="h-6 w-6" />
      case 'MOBILE_MONEY':
        return <Smartphone className="h-6 w-6" />
      case 'CARD_STRIPE':
        return <CreditCard className="h-6 w-6" />
      default:
        return <Wallet className="h-6 w-6" />
    }
  }

  // Step 1: Amount Selection
  if (step === 'amount') {
    return (
      <div className="space-y-6">
        {/* Amount Selection Card */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="bg-linear-to-r from-aerojet-blue to-aerojet-sky px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
                <PiggyBank className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white">Top Up Your Wallet</h3>
                <p className="text-xs text-white/80">Minimum: €{minAmount}</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <p className="mb-5 text-sm text-slate-600 dark:text-slate-400">
              Choose an amount to add to your wallet for exam bookings.
            </p>

            {/* Fixed Amount Options */}
            <div className="mb-5 grid grid-cols-2 gap-3">
              {FIXED_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => {
                    setSelectedAmount(amount)
                    setCustomAmount('')
                  }}
                  className={`group relative overflow-hidden rounded-xl border-2 p-4 text-center transition-all hover:shadow-md ${
                    selectedAmount === amount
                      ? 'border-aerojet-blue bg-aerojet-blue/5 dark:border-blue-500 dark:bg-blue-500/10'
                      : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {selectedAmount === amount && (
                    <div className="absolute top-0 right-0">
                      <div className="h-0 w-0 border-b-20 border-l-20 border-b-transparent border-l-aerojet-blue" />
                    </div>
                  )}
                  <span
                    className={`text-xl font-black ${
                      selectedAmount === amount
                        ? 'text-aerojet-blue dark:text-blue-400'
                        : 'text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    €{amount}
                  </span>
                  {amount === 500 && (
                    <span className="absolute -top-1 -right-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                      Popular
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Custom Amount */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <button
                  type="button"
                  onClick={() => setSelectedAmount(null)}
                  className="flex items-center"
                >
                  {selectedAmount === null && !customAmount ? (
                    <CircleDot className="mr-2 h-5 w-5 text-aerojet-blue dark:text-blue-400" />
                  ) : (
                    <Circle className="mr-2 h-5 w-5 text-slate-300" />
                  )}
                  Custom Amount
                </button>
              </label>
              {selectedAmount === null && (
                <div className="relative">
                  <span className="absolute top-1/2 left-4 -translate-y-1/2 text-lg font-bold text-slate-400">
                    €
                  </span>
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    min={minAmount}
                    step="0.01"
                    placeholder={`Min. ${minAmount}`}
                    className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 py-3 pr-4 pl-10 text-lg font-bold transition-all outline-none focus:border-aerojet-blue focus:bg-white dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              )}
              {customAmount && !isCustomValid() && (
                <p className="flex items-center gap-1 text-sm text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  Minimum amount is €{minAmount}
                </p>
              )}
            </div>
          </div>

          {/* Continue Button */}
          {isAmountSelected() && (
            <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Amount to pay</p>
                  <p className="text-2xl font-black text-aerojet-blue dark:text-blue-400">
                    €{getAmount().toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={handleAmountContinue}
                  className="flex items-center gap-2 rounded-xl bg-linear-to-r from-aerojet-blue to-aerojet-sky px-6 py-3 font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Step 2: Payment Details + Upload Proof
  if (step === 'payment') {
    return (
      <div className="space-y-5">
        {/* Payment Method Card */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                {selectedMethod && getMethodIcon(selectedMethod.type)}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100">
                  {selectedMethod?.name || 'Payment Method'}
                </h3>
                <p className="text-sm text-slate-500">
                  Amount:{' '}
                  <span className="font-bold text-aerojet-blue">€{getAmount().toLocaleString()}</span>
                </p>
              </div>
            </div>
            <button
              onClick={handleBack}
              className="text-sm font-medium text-slate-500 hover:text-aerojet-blue"
            >
              Change
            </button>
          </div>

          {/* Bank Details */}
          {selectedMethod?.type === 'BANK_TRANSFER' && selectedMethod.details && (
            <div className="bg-slate-50 px-6 py-4 dark:bg-slate-800/50">
              <h4 className="mb-3 flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                <Building className="h-4 w-4" />
                Bank Account Details
              </h4>
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-white p-4 dark:bg-slate-900">
                {Object.entries(selectedMethod.details).map(([key, value]) => (
                  <div
                    key={key}
                    className="col-span-2 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800"
                  >
                    <span className="text-xs font-medium text-slate-500 uppercase">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          {selectedMethod?.instructions && (
            <div className="px-6 pb-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {selectedMethod.instructions}
              </p>
            </div>
          )}
        </div>

        {/* Upload Proof Card */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-slate-100 bg-linear-to-r from-green-50 to-emerald-50 px-6 py-4 dark:border-slate-800 dark:from-green-900/20 dark:to-emerald-900/20">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
                <Upload className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100">
                  Upload Payment Proof
                </h3>
                <p className="text-xs text-slate-500">Required for verification</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {!proofUrl ? (
              <UploadDropzone
                endpoint="paymentProof"
                onUploadBegin={() => setUploading(true)}
                onClientUploadComplete={handleUploadComplete}
                onUploadError={(error) => {
                  setUploading(false)
                  toast.error(`Upload error: ${error.message}`)
                }}
                appearance={{
                  container:
                    'border-2 border-dashed border-slate-300 rounded-xl p-8 cursor-pointer hover:border-aerojet-sky hover:bg-blue-50/50 transition-all dark:border-slate-600 dark:hover:border-blue-400',
                  label: 'text-slate-700 dark:text-slate-300 font-semibold text-base',
                  allowedContent: 'text-slate-400 text-sm mt-2',
                  button:
                    'bg-aerojet-blue text-white font-bold px-6 py-3 rounded-xl hover:bg-[#003875] transition-all shadow-lg shadow-blue-500/20',
                }}
              />
            ) : uploading ? (
              <div className="flex items-center justify-center gap-4 rounded-xl border-2 border-blue-200 bg-blue-50 p-8 dark:border-blue-900/30 dark:bg-blue-900/20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <div className="text-center">
                  <p className="font-bold text-blue-900 dark:text-blue-300">
                    Processing Payment...
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    Please wait while we submit your payment
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 rounded-xl border-2 border-green-200 bg-green-50 p-6 dark:border-green-900/30 dark:bg-green-900/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-bold text-green-900 dark:text-green-300">
                    Payment Submitted Successfully!
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-400">
                    Your payment is being verified by our team.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Back Button */}
          {!uploading && !proofUrl && (
            <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
              <button
                onClick={handleBack}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
              >
                <ArrowRight className="h-4 w-4 rotate-180" />
                Back to Amount
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Success State
  if (step === 'success') {
    return (
      <div className="space-y-6">
        <div className="overflow-hidden rounded-2xl border-2 border-green-200 bg-linear-to-br from-green-50 to-emerald-50 shadow-lg shadow-green-500/10 dark:border-green-900/30 dark:from-green-900/20 dark:to-emerald-900/20">
          <div className="flex flex-col items-center justify-center p-10 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 shadow-lg dark:bg-green-900/30">
              <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="mb-2 text-2xl font-black text-green-900 dark:text-green-300">
              Payment Submitted!
            </h3>
            <p className="mb-6 max-w-sm text-green-800 dark:text-green-400">
              Your payment of{' '}
              <strong className="text-green-900 dark:text-green-300">
                €{getAmount().toLocaleString()}
              </strong>{' '}
              has been submitted successfully. Our team will verify it and credit your wallet.
            </p>
            <button
              onClick={() => router.push('/applicant/exam-only')}
              className="flex items-center gap-2 rounded-xl bg-green-600 px-8 py-3 font-bold text-white shadow-lg shadow-green-500/25 transition-all hover:bg-green-700 hover:shadow-xl"
            >
              Return to Dashboard
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
