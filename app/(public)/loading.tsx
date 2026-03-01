'use client'

import { useEffect } from 'react'

export default function PublicLoading() {
  useEffect(() => {
    document.body.classList.add('force-navbar-solid')
    return () => document.body.classList.remove('force-navbar-solid')
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="border-t-public-secondary h-10 w-10 animate-spin rounded-full border-4 border-slate-200" />
        <p className="text-sm font-bold tracking-widest text-slate-400 uppercase">Loading...</p>
      </div>
    </div>
  )
}
