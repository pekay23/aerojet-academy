'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, ShieldAlert, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

interface AccessCodeEntryProps {
  initialCode?: string
}

export default function AccessCodeEntry({ initialCode }: AccessCodeEntryProps) {
  const router = useRouter()
  const [code, setCode] = useState(initialCode || '')
  const [loading, setLoading] = useState(false)
  const [showCode, setShowCode] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return

    setLoading(true)
    try {
      const res = await fetch('/api/exams/access-code/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      })

      const json = await res.json()
      if (!res.ok || !json.valid) {
        toast.error(json.error || 'Invalid access code')
        setLoading(false)
        return
      }

      toast.success('Access code validated')
      router.push(`/exams/attempt/${json.sessionId}`)
    } catch {
      toast.error('Failed to validate access code')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-black">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6 flex items-center justify-center">
            <div className="bg-aerojet-blue/10 flex h-12 w-12 items-center justify-center rounded-full">
              <ShieldAlert className="text-aerojet-blue h-6 w-6" />
            </div>
          </div>

          <h1 className="text-center text-2xl font-bold text-slate-900 dark:text-white">
            Secure Exam Access
          </h1>
          <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
            Enter your access code to begin the examination.
            <br />
            Please ensure you are in a quiet, well-lit environment.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Access Code
              </label>
              <div className="relative mt-1">
                <input
                  id="code"
                  type={showCode ? 'text' : 'password'}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  className="focus:border-aerojet-blue focus:ring-aerojet-blue/20 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-center font-mono text-lg tracking-widest text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                  maxLength={32}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCode(!showCode)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showCode ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="bg-aerojet-blue flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold text-white shadow-md transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Validating...
                </>
              ) : (
                <>
                  <Lock className="h-5 w-5" />
                  Begin Exam
                </>
              )}
            </button>
          </form>

          <div className="mt-6 rounded-xl bg-amber-50 p-4 dark:bg-amber-900/20">
            <p className="text-xs text-amber-800 dark:text-amber-200">
              <strong>Important:</strong> Once you begin the exam, you will be locked into
              fullscreen mode. Switching tabs or closing the browser may result in automatic
              submission. Ensure you have a stable internet connection before proceeding.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
