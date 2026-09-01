'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, XCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function AccessCodeEntry() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/student/exams/internal/access-code/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const json = await res.json()
      if (json.success && json.data?.valid) {
        setSuccess(true)
        setTimeout(() => {
          router.push(`/student/exams/internal?accessCode=${encodeURIComponent(json.data.code)}`)
        }, 800)
      } else {
        setError(json.error || 'Invalid access code')
      }
    } catch {
      setError('Could not connect to the server. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:p-8">
        {success ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="mb-4 h-12 w-12 text-green-500" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Access Code Accepted</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Redirecting to exam selection...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="accessCode" className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                Access Code
              </label>
              <input
                id="accessCode"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Enter your access code"
                className={cn(
                  'w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-800 focus:outline-none focus:ring-1 focus:ring-blue-800 dark:bg-slate-800 dark:text-white',
                  error ? 'border-red-300 dark:border-red-700' : 'border-slate-200 dark:border-slate-700'
                )}
                autoFocus
                maxLength={20}
              />
              {error && (
                <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400">
                  <XCircle className="h-3.5 w-3.5 shrink-0" />
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-800 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-800/90 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Verify Access Code'
              )}
            </button>

            <p className="text-center text-xs text-slate-400">
              The access code is provided by your instructor or exam administrator.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
