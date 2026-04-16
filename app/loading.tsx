'use client'

import { useEffect } from 'react'
import Image from 'next/image'

export default function GlobalLoading() {
  useEffect(() => {
    document.body.classList.add('force-navbar-solid')
    return () => document.body.classList.remove('force-navbar-solid')
  }, [])
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-slate-950">
      <div className="relative mb-8">
        <div className="bg-public-secondary/20 absolute inset-0 animate-ping rounded-full" />
        <div className="relative flex h-32 w-32 items-center justify-center rounded-full border border-slate-100 bg-white shadow-xl">
          <Image
            src="/images/logos/AATA_logo_hor_onWhite.webp"
            alt="Aerojet"
            width={80}
            height={20}
            className="h-auto w-20 animate-pulse object-contain transition-all duration-700"
          />
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-1.5">
          <div className="bg-public-primary h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:-0.3s]" />
          <div className="bg-public-primary h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:-0.15s]" />
          <div className="bg-public-primary h-1.5 w-1.5 animate-bounce rounded-full" />
        </div>
        <p className="text-sm font-black tracking-[0.4em] text-slate-500 uppercase">
          Preparing for Takeoff
        </p>
      </div>
    </div>
  )
}
