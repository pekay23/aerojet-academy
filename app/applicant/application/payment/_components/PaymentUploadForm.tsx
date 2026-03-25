'use client'

import { useState } from 'react'
import { UploadDropzone } from '@/lib/uploads/uploadthing'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { CheckCircle2, FileImage, RefreshCw } from 'lucide-react'

interface Props {
  existingProofUrl: string | null | undefined
}

export default function PaymentUploadForm({ existingProofUrl }: Props) {
  const [uploading, setUploading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const router = useRouter()

  if (submitted || existingProofUrl) {
    return (
      <div className="space-y-3 rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-green-500" />
        <p className="font-bold text-green-800">Payment Proof Submitted</p>
        <p className="text-sm text-green-600">
          Your payment proof has been received. Our team will verify it shortly. You'll be notified
          once it's approved.
        </p>
        {existingProofUrl && (
          <a
            href={existingProofUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-green-700 underline underline-offset-2"
          >
            <FileImage className="h-3.5 w-3.5" />
            View Uploaded File
          </a>
        )}
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
    <div className="space-y-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
      <h2 className="font-bold text-slate-900 dark:text-slate-100">Upload Your Payment Proof</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Upload a screenshot, scan, or PDF of your bank transfer receipt or payment confirmation.
        Accepted formats: JPG, PNG, PDF (max 4MB).
      </p>

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
            // Save the URL to the user's record
            const response = await fetch('/api/applicant/upload-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ proofUrl: res[0].url }),
            })
            const data = await response.json()
            if (!response.ok) {
              toast.error(data.error || 'Failed to save payment proof.')
              return
            }
            toast.success('Payment proof submitted! Awaiting review.')
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
            'border-2 border-dashed border-slate-200 rounded-xl p-8 cursor-pointer hover:border-aerojet-sky transition-colors',
          label: 'text-slate-700 font-semibold',
          allowedContent: 'text-slate-400 text-xs',
          button:
            'bg-aerojet-blue text-white font-bold px-6 py-2.5 rounded-xl hover:bg-[#003875] transition-colors',
        }}
      />

      {uploading && <p className="animate-pulse text-center text-sm text-slate-500 dark:text-slate-400">Uploading…</p>}
    </div>
  )
}
