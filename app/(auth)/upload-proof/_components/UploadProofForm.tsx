'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle2, RefreshCw } from 'lucide-react'
import { UploadDropzone } from '@/lib/uploads/uploadthing'

export default function UploadProofForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [registrationCode, setRegistrationCode] = useState('')
  const [uploading, setUploading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [receiptUrl, setReceiptUrl] = useState('')

  useEffect(() => {
    const code = searchParams.get('code')
    if (code) {
      setRegistrationCode(code)
    }
  }, [searchParams])

  if (submitted) {
    return (
      <div className="space-y-3 rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-green-500" />
        <p className="font-bold text-green-800">Proof Submitted Successfully!</p>
        <p className="text-sm text-green-600">
          Our admissions team will review your payment as soon as possible. Once verified, you will
          receive your portal login credentials via email.
        </p>
        <button
          onClick={() => router.push('/')}
          className="mt-4 w-full rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-green-700"
        >
          Go to Home Page
        </button>
        <div className="mt-4 text-center">
          <p className="text-sm text-green-600">
            Already verified?{' '}
            <button
              onClick={() => router.push('/login')}
              className="font-bold text-green-700 hover:underline"
            >
              Login here
            </button>
          </p>
        </div>
      </div>
    )
  }

  const handleManualRegistrationCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegistrationCode(e.target.value.toUpperCase().replace(/\s/g, ''))
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Registration Code
        </label>
        <input
          type="text"
          value={registrationCode}
          onChange={handleManualRegistrationCodeChange}
          placeholder="e.g. AERO-2026-123456"
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 font-mono text-slate-900 transition-all outline-none focus:border-aerojet-sky focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          required
        />
        <p className="mt-1 text-xs text-slate-500">
          Enter the code from your registration confirmation email.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
        <p className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">
          Upload Payment Receipt
        </p>
        {!registrationCode ? (
          <div className="text-center text-sm text-amber-600">
            Please enter your registration code above first.
          </div>
        ) : (
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
                const proofUrl = res[0].url
                setReceiptUrl(proofUrl)

                // Save the URL to the user's record using the public API
                const response = await fetch('/api/public/submit-payment-proof', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ registrationCode, proofUrl }),
                })

                const data = await response.json()

                if (!response.ok) {
                  toast.error(data.error || 'Failed to submit payment proof.')
                  return
                }

                toast.success('Payment proof submitted successfully!')
                setSubmitted(true)
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
                'border-2 border-dashed border-slate-300 bg-white dark:bg-slate-900 rounded-xl p-8 cursor-pointer hover:border-aerojet-sky transition-colors',
              label: 'text-slate-700 dark:text-slate-300 font-semibold',
              allowedContent: 'text-slate-400 text-xs',
              button:
                'bg-aerojet-blue text-white font-bold px-6 py-2.5 rounded-xl hover:bg-[#003875] transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
            }}
          />
        )}
        {uploading && (
          <p className="mt-3 animate-pulse text-center text-sm text-slate-500">
            Uploading your receipt...
          </p>
        )}
      </div>
    </div>
  )
}
