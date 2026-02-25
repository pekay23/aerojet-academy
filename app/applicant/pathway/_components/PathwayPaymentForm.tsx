'use client'

import { useState } from 'react'
import { UploadDropzone } from '@/lib/uploads/uploadthing'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { CheckCircle2, FileImage, RefreshCw, Loader2, ArrowRight, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface PaymentOption {
  id: string
  label: string
  amount: number
  description: string
}

interface Props {
  options: PaymentOption[]
  currency: string
  programmeName: string
}

export default function PathwayPaymentForm({ options, currency, programmeName }: Props) {
  const [uploading, setUploading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [selectedOptionId, setSelectedOptionId] = useState<string>(options[0]?.id || '')

  const router = useRouter()

  const selectedOption = options.find((o) => o.id === selectedOptionId)

  if (submitted) {
    return (
      <div className="space-y-3 rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-green-500" />
        <p className="font-bold text-green-800">Tuition Payment Proof Submitted</p>
        <p className="text-sm text-green-600">
          Your payment proof for the {selectedOption?.label} has been received. Our team will verify
          it in 1-2 business days. You will be notified and promoted to Student status once
          approved.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="mx-auto mt-2 block text-xs text-slate-400 underline hover:text-slate-600 dark:text-slate-400"
        >
          <RefreshCw className="mr-1 inline h-3 w-3" />
          Upload a different file
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-bold text-slate-900 dark:text-slate-100">
          Step 1: Select Payment Option
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Choose a payment plan for {programmeName}.
        </p>

        <Select value={selectedOptionId} onValueChange={setSelectedOptionId}>
          <SelectTrigger className="h-auto w-full py-3 text-left">
            <SelectValue placeholder="Select Payment Option" />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt.id} value={opt.id}>
                <div className="flex flex-col gap-1 py-1">
                  <span className="font-bold">
                    {opt.label} — {currency} {opt.amount.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-500">{opt.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedOption && (
          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
            <div className="flex items-start gap-3">
              <Wallet className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
              <div>
                <h3 className="text-sm font-bold text-blue-900 dark:text-blue-400">
                  Amount Due: {currency} {selectedOption.amount.toLocaleString()}
                </h3>
                <p className="mt-1 text-xs text-blue-700/80">{selectedOption.description}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-bold text-slate-900 dark:text-slate-100">
          Step 2: Upload Payment Proof
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Upload a screenshot, scan, or PDF of your bank transfer receipt or payment confirmation.
          Accepted formats: JPG, PNG, PDF (max 4MB).
        </p>

        <UploadDropzone
          endpoint="paymentProof"
          onUploadBegin={() => setUploading(true)}
          disabled={!selectedOptionId}
          onClientUploadComplete={async (res) => {
            setUploading(false)
            if (!res?.[0]?.url) {
              toast.error('Upload failed — no file URL returned.')
              return
            }

            try {
              // Save the URL to the user's record
              const response = await fetch('/api/applicant/pathway-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  proofUrl: res[0].url,
                  amount: selectedOption?.amount,
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
            Uploading…
          </p>
        )}
      </div>
    </div>
  )
}
