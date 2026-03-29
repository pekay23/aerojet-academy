'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, MailX, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react'

export default function UnsubscribePage() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'invalid'>(
    email ? 'idle' : 'invalid'
  )
  const [error, setError] = useState('')

  const handleUnsubscribe = async () => {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to unsubscribe')
      }

      setStatus('success')
    } catch (err: any) {
      setError(err.message)
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'invalid') {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-aerojet-blue mb-3 text-2xl font-black tracking-tight uppercase">
          Invalid Link
        </h2>
        <p className="mb-8 text-sm text-slate-500 dark:text-slate-400">
          This unsubscribe link is missing an email address. Please use the link provided in your
          email.
        </p>
        <Link
          href="/"
          className="text-aerojet-sky inline-flex items-center gap-2 text-sm font-bold hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Website
        </Link>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
          <CheckCircle2 className="h-8 w-8 text-green-500" />
        </div>
        <h2 className="text-aerojet-blue mb-3 text-2xl font-black tracking-tight uppercase">
          You&apos;re Unsubscribed
        </h2>
        <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
          <strong className="text-slate-700">{email}</strong> has been removed from marketing
          emails.
        </p>
        <p className="mb-8 text-xs text-slate-400">
          You will still receive transactional emails related to your account, payments, and exam
          bookings.
        </p>
        <Link
          href="/"
          className="text-aerojet-sky inline-flex items-center gap-2 text-sm font-bold hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Website
        </Link>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-aerojet-blue mb-3 text-2xl font-black tracking-tight uppercase">
          Something Went Wrong
        </h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">{error}</p>
        <button
          onClick={handleUnsubscribe}
          className="bg-aerojet-blue hover:bg-aerojet-sky mb-4 flex w-full items-center justify-center gap-2 rounded-xl py-4 text-xs font-black tracking-widest text-white uppercase shadow-lg transition-all"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="hover:text-aerojet-sky inline-flex items-center gap-2 text-sm font-medium text-slate-500"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Website
        </Link>
      </div>
    )
  }

  return (
    <div className="text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
        <MailX className="h-8 w-8 text-slate-500" />
      </div>
      <h2 className="text-aerojet-blue mb-3 text-2xl font-black tracking-tight uppercase">
        Unsubscribe
      </h2>
      <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
        Are you sure you want to stop receiving marketing emails at{' '}
        <strong className="text-slate-700">{email}</strong>?
      </p>
      <p className="mb-8 text-xs text-slate-400">
        You will still receive transactional emails related to your account.
      </p>

      <button
        onClick={handleUnsubscribe}
        disabled={loading}
        className="bg-aerojet-blue hover:bg-aerojet-sky flex w-full items-center justify-center gap-2 rounded-xl py-4 text-xs font-black tracking-widest text-white uppercase shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Unsubscribing...
          </>
        ) : (
          'Unsubscribe'
        )}
      </button>

      <div className="mt-8">
        <Link
          href="/"
          className="hover:text-aerojet-sky inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Website
        </Link>
      </div>
    </div>
  )
}
