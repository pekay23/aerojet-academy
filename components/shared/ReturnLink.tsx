'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface ReturnLinkProps {
  fallbackHref: string
  label?: string
  returnType?: string
  className?: string
}

export function appendReturnNavigation(
  href: string,
  returnUrl: string,
  returnType = 'notification'
) {
  const separator = href.includes('?') ? '&' : '?'
  return `${href}${separator}returnUrl=${encodeURIComponent(returnUrl)}${returnType ? `&returnType=${encodeURIComponent(returnType)}` : ''}`
}

export function ReturnLink({
  fallbackHref,
  label = 'Back',
  returnType,
  className,
}: ReturnLinkProps) {
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('returnUrl') || fallbackHref
  const href = returnType
    ? `${returnUrl}${returnUrl.includes('?') ? '&' : '?'}returnType=${encodeURIComponent(returnType)}`
    : returnUrl

  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 ${className || ''}`}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Link>
  )
}
