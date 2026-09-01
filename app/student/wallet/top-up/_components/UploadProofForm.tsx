'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, CheckCircle2, AlertCircle, Loader2, RefreshCw } from 'lucide-react'
import { UploadDropzone } from '@/lib/uploads/uploadthing'
import { toast } from 'sonner'

const CURRENCIES = [
  { code: 'EUR', symbol: '\u20AC', label: 'Euro' },
  { code: 'GHS', symbol: 'GH\u20B5', label: 'Ghana Cedi' },
  { code: 'USD', symbol: '$', label: 'US Dollar' },
] as const

interface UploadProofFormProps {
  studentId: string
}

export function UploadProofForm({ studentId }: UploadProofFormProps) {
  const [proofUrl, setProofUrl] = useState<string | null>(null)
  const [fileDetails, setFileDetails] = useState<{
    name: string
    size: number
    type: string
  } | null>(null)
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('GHS')
  const [eurEquivalent, setEurEquivalent] = useState<number | null>(null)
  const [ratesLoading, setRatesLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  // Fetch EUR equivalent when amount or currency changes
  useEffect(() => {
    if (!amount || currency === 'EUR') {
      setEurEquivalent(currency === 'EUR' ? Number(amount) || null : null)
      return
    }
    const controller = new AbortController()
    const fetchRate = async () => {
      setRatesLoading(true)
      try {
        const res = await fetch('/api/finance/rates', { signal: controller.signal })
        const data = await res.json()
        if (data.rates) {
          const rate = data.rates[currency]
          if (rate) {
            setEurEquivalent(Math.round((Number(amount) / rate) * 100) / 100)
          }
        }
      } catch (err: any) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        console.error('Rate fetch error:', err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setRatesLoading(false)
      }
    }
    const timeout = setTimeout(fetchRate, 500)
    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [amount, currency])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!proofUrl || !amount) {
      toast.error('Please provide both the amount and upload a proof.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/student/wallet/upload-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency,
          eurEquivalent: eurEquivalent || amount,
          studentId,
          proofUrl,
          filename: fileDetails?.name,
          fileType: fileDetails?.type,
          fileSize: fileDetails?.size,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit payment details.')
      }

      setSuccess(true)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-xl bg-green-50 p-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h3 className="text-lg font-bold text-green-900">Upload Successful!</h3>
        <p className="mt-2 text-sm text-green-700">
          Your payment proof has been submitted for verification.
        </p>
        <button
          onClick={() => {
            setSuccess(false)
            setProofUrl(null)
            setFileDetails(null)
            setAmount('')
            setCurrency('GHS')
          }}
          className="mt-6 text-sm font-bold text-green-600 hover:underline"
        >
          Submit another proof
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Currency & Amount */}
      <div className="space-y-3">
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
          Amount Paid
        </label>
        <div className="flex gap-2">
          <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
            {CURRENCIES.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => setCurrency(c.code)}
                className={`rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                  currency === c.code
                    ? 'bg-white text-blue-800 shadow-sm dark:bg-slate-700 dark:text-white'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                {c.symbol} {c.code}
              </button>
            ))}
          </div>
        </div>
        <input
          type="number"
          step="0.01"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={`e.g. ${currency === 'GHS' ? '5,000.00' : currency === 'USD' ? '500.00' : '450.00'}`}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-800/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        {amount && currency !== 'EUR' && (
          <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs dark:bg-blue-900/20">
            {ratesLoading ? (
              <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />
            ) : (
              <span className="text-blue-700 dark:text-blue-300">
                {'\u2248'} {'\u20AC'}
                {eurEquivalent?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '...'}
              </span>
            )}
            <span className="text-blue-500/60 dark:text-blue-400/60">indicative bank rate</span>
          </div>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-bold text-slate-700">
          Receipt / Proof of Payment
        </label>

        {!proofUrl ? (
          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
            <UploadDropzone
              endpoint="paymentProof"
              onClientUploadComplete={(res) => {
                if (res && res[0]) {
                  setProofUrl(res[0].url)
                  setFileDetails({
                    name: res[0].name,
                    size: res[0].size,
                    type: res[0].type || 'application/octet-stream',
                  })
                  toast.success('Receipt uploaded successfully')
                }
              }}
              onUploadError={(error: Error) => {
                toast.error(`Error uploading: ${error.message}`)
              }}
              appearance={{
                container: 'border-0 bg-slate-50/50',
                label: 'text-aerojet-blue',
                button: 'bg-blue-800 text-white hover:bg-[#003875]',
                allowedContent: 'text-slate-400',
              }}
            />
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-800">
                <FileText className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                  {fileDetails?.name || 'Uploaded Receipt'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {fileDetails?.size ? (fileDetails.size / 1024 / 1024).toFixed(2) : '0.00'} MB
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setProofUrl(null)
                  setFileDetails(null)
                }}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:text-slate-400"
              >
                <AlertCircle className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading || !proofUrl || !amount}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-800 py-4 text-sm font-bold text-white shadow-lg transition-all hover:bg-[#003875] disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <CheckCircle2 className="h-5 w-5" />
            Submit for Verification
          </>
        )}
      </button>
    </form>
  )
}
