'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'

function segmentToLabel(segment: string): string {
  // Check if it's a UUID-like or MongoDB-like ID (very long string)
  if (segment.length > 20) return 'Loading...'

  return segment
    .replace(/\[.*?\]/g, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function BreadcrumbNav() {
  const pathname = usePathname()
  const [resolvedNames, setResolvedNames] = useState<Record<string, string>>({})
  const segments = pathname.split('/').filter(Boolean)

  // Remove route group prefixes
  const cleanSegments = segments.filter((s) => !s.startsWith('(') && !s.endsWith(')'))

  useEffect(() => {
    const fetchNames = async () => {
      const idSegments = cleanSegments.filter((s) => s.length > 20 && !resolvedNames[s])

      for (const id of idSegments) {
        try {
          const res = await fetch(`/api/public/courses/${id}/name`)
          if (res.ok) {
            const data = await res.json()
            setResolvedNames((prev) => ({ ...prev, [id]: data.name }))
          }
        } catch (e) {
          console.error('Failed to fetch breadcrumb name:', e)
        }
      }
    }

    fetchNames()
  }, [cleanSegments])

  if (cleanSegments.length <= 1) return null

  return (
    <nav className="mb-6 flex items-center gap-1.5 overflow-x-auto text-xs text-slate-400 dark:text-slate-500">
      <Link
        href="/"
        className="shrink-0 transition-colors hover:text-slate-600 dark:hover:text-slate-300"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>
      {cleanSegments.map((segment, i) => {
        const href = '/' + cleanSegments.slice(0, i + 1).join('/')
        const isLast = i === cleanSegments.length - 1
        const label = resolvedNames[segment] || segmentToLabel(segment)

        return (
          <span key={href} className="flex shrink-0 items-center gap-1.5">
            <ChevronRight className="h-3 w-3 text-slate-300 dark:text-slate-700" />
            {isLast ? (
              <span className="max-w-[200px] truncate font-semibold text-slate-700 dark:text-slate-200">
                {label}
              </span>
            ) : (
              <Link
                href={href}
                className="max-w-[150px] truncate transition-colors hover:text-slate-600 dark:hover:text-slate-300"
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
