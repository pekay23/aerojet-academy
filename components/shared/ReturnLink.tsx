'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface ReturnLinkProps {
  fallbackHref: string
  label?: string
  className?: string
}

export function ReturnLink({ fallbackHref, label = 'Back', className }: ReturnLinkProps) {
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('returnUrl') || fallbackHref

  return (
    <Link
      href={returnUrl}
      className={`inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 ${className || ''}`}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Link>
  )
}
