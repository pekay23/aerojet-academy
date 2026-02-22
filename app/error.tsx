'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { AlertCircle, RefreshCcw } from 'lucide-react'

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
          src="/images/logos/AATA_logo_hor_onWhite.png"
          alt="Aerojet Academy"
          width={180}
          height={40}
          className="h-auto w-auto opacity-50 grayscale"
        />
      </Link>

      <div className="w-full max-w-md space-y-6 rounded-4xl border border-red-50 bg-white p-12 text-center shadow-xl">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <AlertCircle className="h-8 w-8 text-red-500" />
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
            <RefreshCcw className="h-4 w-4" /> Try Again
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
