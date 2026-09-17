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

const RETURN_NAV_PARAMS = ['returnUrl', 'returnType']

function stripReturnNavParams(url: string): { base: string; searchParams: URLSearchParams } {
  const separatorIdx = url.indexOf('?')
  const base = separatorIdx === -1 ? url : url.slice(0, separatorIdx)
  const searchParams = new URLSearchParams(separatorIdx === -1 ? '' : url.slice(separatorIdx + 1))
  for (const key of RETURN_NAV_PARAMS) {
    searchParams.delete(key)
  }
  return { base, searchParams }
}

function buildUrl(base: string, searchParams: URLSearchParams): string {
  const qs = searchParams.toString()
  return qs ? `${base}?${qs}` : base
}

export function appendReturnNavigation(
  href: string,
  returnUrl: string,
  returnType = 'notification'
) {
  const { base, searchParams } = stripReturnNavParams(href)
  searchParams.set('returnUrl', returnUrl)
  if (returnType) {
    searchParams.set('returnType', returnType)
  }
  return buildUrl(base, searchParams)
}

export function ReturnLink({
  fallbackHref,
  label = 'Back',
  returnType,
  className,
}: ReturnLinkProps) {
  const searchParams = useSearchParams()
  const rawReturnUrl = searchParams.get('returnUrl') || fallbackHref
  const { base, searchParams: cleanedParams } = stripReturnNavParams(rawReturnUrl)
  if (returnType) {
    cleanedParams.set('returnType', returnType)
  }
  const href = buildUrl(base, cleanedParams)

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
