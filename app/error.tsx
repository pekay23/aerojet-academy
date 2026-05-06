'use client'

export const dynamic = 'force-dynamic'

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6">
      <Link href="/" className="mb-12">
        <Image
          src="/images/logos/AATA_logo_hor_onWhite.webp"
          alt="Aerojet Academy"
          width={180}
          height={40}
          style={{ width: 'auto', height: 'auto' }}
          className="h-10 w-auto opacity-50 grayscale object-contain"
        />
      </Link>

      <div className="w-full max-w-md space-y-6 rounded-4xl border border-slate-100 bg-white p-12 text-center shadow-xl">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <svg
              className="h-8 w-8 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight text-slate-800 uppercase">
            System Disturbance
          </h1>
          <p className="text-sm leading-relaxed font-medium text-slate-600">
            We've encountered an unexpected technical issue. Our engineers have been notified.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <button
            onClick={reset}
            className="bg-public-primary hover:bg-public-secondary flex h-12 items-center justify-center gap-2 rounded-xl px-8 text-xs font-black tracking-widest text-white uppercase transition-all hover:shadow-lg active:scale-95"
          >
            <svg
              className="h-4 w-4 animate-spin-reverse"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M21 20v-5h-.581m0 0a8.003 8.003 0 01-15.357-2"
              />
            </svg>
            Try Again
          </button>

          <Link
            href="/"
            className="flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-8 text-xs font-black tracking-widest text-slate-600 uppercase transition-all hover:bg-slate-50"
          >
            Back to Base
          </Link>
        </div>
      </div>

      <p className="mt-8 text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">
        Error Log: {error.digest || 'Internal Transmission Error'}
      </p>
    </div>
  )
}
