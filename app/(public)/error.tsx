'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function PublicError({ _error, reset }: { _error: Error; reset: () => void }) {
  useEffect(() => {
    document.body.classList.add('force-navbar-solid')
    return () => document.body.classList.remove('force-navbar-solid')
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="mb-3 text-2xl font-black tracking-tight text-aerojet-blue uppercase">
          Something went wrong
        </h2>
        <p className="mb-8 text-sm text-slate-500">We're sorry, an unexpected error occurred.</p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <button
            onClick={reset}
            className="rounded-xl bg-aerojet-sky px-6 py-3 text-xs font-bold tracking-widest text-white uppercase transition-colors hover:bg-aerojet-blue"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="rounded-xl bg-slate-100 px-6 py-3 text-xs font-bold tracking-widest text-slate-600 uppercase transition-colors hover:bg-slate-200"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  )
}
