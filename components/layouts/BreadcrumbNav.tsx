'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const PORTAL_LABELS: Record<string, string> = {
  student: 'Student Dashboard',
  staff: 'Staff Dashboard',
  instructor: 'Instructor Dashboard',
  applicant: 'Applicant Dashboard',
}

function segmentToLabel(segment: string): string {
  if (segment.length > 20) return '...'
  return segment
    .replace(/\[.*?\]/g, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function BreadcrumbNav({ className }: { className?: string }) {
  const pathname = usePathname()
  const [resolvedNames, setResolvedNames] = useState<Record<string, string>>({})

  const segments = pathname
    .split('/')
    .filter((s) => Boolean(s) && !s.startsWith('(') && !s.endsWith(')'))

  const portal = segments[0] || ''
  const portalDashboardLabel = PORTAL_LABELS[portal] || 'Dashboard'
  const subSegments = segments.slice(1)

  useEffect(() => {
    const fetchNames = async () => {
      for (let i = 0; i < subSegments.length; i++) {
        const segment = subSegments[i]
        const prevSegment = i > 0 ? subSegments[i - 1] : null
        const isCourseId = segment.length > 20 && prevSegment === 'courses'

        if (isCourseId && !resolvedNames[segment]) {
          try {
            const res = await fetch(`/api/public/courses/${segment}/name`)
            if (res.ok) {
              const data = await res.json()
              setResolvedNames((prev) => ({ ...prev, [segment]: data.name }))
            }
          } catch (e) {
            console.error('Failed to fetch breadcrumb name:', e)
          }
        }
      }
    }

    fetchNames()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  return (
    <nav
      className={cn(
        'hidden items-center gap-1.5 text-xs text-slate-500 lg:flex dark:text-slate-400',
        className
      )}
      aria-label="Breadcrumb"
    >
      <Link
        href={`/${portal}`}
        className="shrink-0 transition-colors hover:text-slate-800 dark:hover:text-slate-100"
      >
        {portalDashboardLabel}
      </Link>
      {subSegments.map((segment, i) => {
        const href = '/' + portal + '/' + subSegments.slice(0, i + 1).join('/')
        const isLast = i === subSegments.length - 1
        const label = resolvedNames[segment] || segmentToLabel(segment)

        return (
          <span key={href} className="flex shrink-0 items-center gap-1.5">
            <span className="text-xs text-slate-400 dark:text-slate-500">/</span>
            {isLast ? (
              <span className="max-w-30 truncate font-bold text-slate-800 dark:text-slate-100">
                {label}
              </span>
            ) : (
              <Link
                href={href}
                className="max-w-30 truncate font-medium transition-colors hover:text-slate-800 dark:hover:text-slate-100"
              >
                {label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
