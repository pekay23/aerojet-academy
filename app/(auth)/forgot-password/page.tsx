'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Metadata } from 'next'
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'

// Metadata exported via layout — client components cannot export metadata directly

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Failed to send reset email')
      }

      setSent(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
          <CheckCircle2 className="h-8 w-8 text-green-500" />
        </div>
        <h2 className="text-aerojet-blue mb-3 text-2xl font-black tracking-tight uppercase">
          Check Your Email
        </h2>
        <p className="mb-8 text-sm text-slate-500 dark:text-slate-400">
          If an account exists for <strong className="text-slate-700">{email}</strong>, we've sent a
          password reset link. Please check your spam/junk folder if you don't see it in your inbox.
        </p>
        <Link
          href="/login"
          className="text-aerojet-sky inline-flex items-center gap-2 text-sm font-bold hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Login
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-aerojet-blue text-2xl font-black tracking-tight uppercase sm:text-3xl">
          Reset Password
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Enter the email associated with your account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="mb-2 block text-xs font-bold tracking-widest text-slate-500 uppercase dark:text-slate-400">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              className="focus:ring-aerojet-sky w-full rounded-xl border border-slate-200 bg-white py-3.5 pr-4 pl-11 text-sm text-slate-900 transition-all placeholder:text-slate-300 focus:border-transparent focus:ring-2 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !email}
          className="bg-aerojet-blue hover:bg-aerojet-sky flex w-full items-center justify-center gap-2 rounded-xl py-4 text-xs font-black tracking-widest text-white uppercase shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Sending...
            </>
          ) : (
            'Send Reset Link'
          )}
        </button>
      </form>

      <div className="mt-8 text-center">
        <Link
          href="/login"
          className="hover:text-aerojet-sky inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors dark:text-slate-400"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Login
        </Link>
      </div>
    </div>
  )
}
