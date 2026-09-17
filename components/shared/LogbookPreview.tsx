'use client'

import { useMemo, useState } from 'react'
import type React from 'react'
import Image from 'next/image'
import { BookOpen, ChevronLeft, ChevronRight, Printer, ShieldCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface LogbookPreviewEntry {
  id: string
  date: string
  aircraftType: string
  aircraftRegistration: string
  ataChapter: { code: string; title: string; category?: string }
  taskDescription: string
  workOrderReference: string | null
  maintenanceManualRef: string | null
  maintenanceType: string
  durationHours: number
  supervisorSignature: boolean
  studentSignature: boolean
  verifiedByManagement: boolean
  licenceCategory: string | null
  workEnvironment: string | null
  toolsUsed: string | null
  partNumbersUsed?: string | null
  safetyPrecautions?: string | null
  competencyRating: number | null
}

export interface LogbookPreviewData {
  studentName?: string
  studentId?: string | null
  email?: string
  licenceCategory: string
  facilityName: string
  facilityApprovalNo: string | null
  startDate: string
  targetEndDate: string | null
  totalLoggedHours: number
  status: string
  entries: LogbookPreviewEntry[]
  analytics: {
    totalHours: number
    hoursByType: Record<string, number>
    ataChaptersCovered: number
    signedEntries: number
    unsignedEntries: number
    monthsExperience?: number
    totalATAChapters?: number
  }
}

export function LogbookPreview({
  logbook,
  mode,
}: {
  logbook: LogbookPreviewData
  mode: 'staff' | 'student'
}) {
  const [page, setPage] = useState(0)
  const pages = useMemo(() => buildPages(logbook), [logbook])
  const currentPage = pages[page]
  const isStudent = mode === 'student'
  const ownerLabel = [logbook.studentName, logbook.studentId, logbook.email]
    .filter(Boolean)
    .join(' - ')

  const goToPage = (direction: -1 | 1) => {
    setPage((current) => Math.min(Math.max(current + direction, 0), pages.length - 1))
  }

  const preventProtectedAction = (event: React.SyntheticEvent | React.KeyboardEvent) => {
    if (!isStudent) return
    event.preventDefault()
  }

  return (
    <section
      className={cn(
        'logbook-preview rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900',
        isStudent && 'select-none'
      )}
      onContextMenu={preventProtectedAction}
      onCopy={preventProtectedAction}
      onCut={preventProtectedAction}
      onKeyDown={(event) => {
        if (!isStudent) return
        const key = event.key.toLowerCase()
        if ((event.ctrlKey || event.metaKey) && ['p', 's', 'c'].includes(key)) {
          event.preventDefault()
        }
      }}
      tabIndex={isStudent ? 0 : undefined}
    >
      <style jsx>{`
        .logbook-page::before {
          background-image: url('/favicon-aeroaviation.webp');
        }
        @media print {
          .logbook-preview[data-protected='true'] {
            display: none;
          }
          .logbook-screen-page {
            display: none;
          }
          .logbook-print-pages {
            display: block;
          }
          .logbook-print-page {
            break-after: page;
            page-break-after: always;
          }
          .logbook-toolbar,
          .logbook-protection-note {
            display: none;
          }
          .logbook-preview {
            border: 0;
            box-shadow: none;
          }
        }
      `}</style>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-aerojet-blue flex items-center gap-2 text-sm font-bold dark:text-blue-300">
            <BookOpen className="size-4" />
            Logbook preview
          </div>
          <p className="mt-1 text-sm text-pretty text-slate-500 dark:text-slate-400">
            {isStudent
              ? 'Protected portal preview of your official Aerojet OJT logbook.'
              : 'Printable preview of the official Aerojet OJT logbook layout.'}
          </p>
        </div>
        <div className="logbook-toolbar flex items-center gap-2">
          {!isStudent && (
            <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="size-4" />
              Print preview
            </Button>
          )}
          {isStudent && (
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">
              <ShieldCheck className="size-4 text-emerald-600" />
              View-only
            </div>
          )}
        </div>
      </div>

      {isStudent && (
        <p className="logbook-protection-note mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
          This portal view is watermarked and download-disabled. Browser controls can deter copying,
          but device-level screenshots cannot be fully blocked by any web application.
        </p>
      )}

      <div className="logbook-preview" data-protected={isStudent} aria-label="Logbook page preview">
        <div className="logbook-screen-page">
          <PreviewPage
            page={currentPage}
            pageIndex={page}
            logbook={logbook}
            ownerLabel={isStudent ? ownerLabel : ''}
          />
        </div>
        {!isStudent && (
          <div className="logbook-print-pages hidden">
            {pages.map((printPage, index) => (
              <div key={index} className="logbook-print-page">
                <PreviewPage page={printPage} pageIndex={index} logbook={logbook} ownerLabel="" />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="logbook-toolbar mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-500 tabular-nums">
          Page {page + 1} of {pages.length}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => goToPage(-1)}
            disabled={page === 0}
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => goToPage(1)}
            disabled={page === pages.length - 1}
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}

function PreviewPage({
  page,
  pageIndex,
  logbook,
  ownerLabel,
}: {
  page: { kind: 'cover' } | { kind: 'entries'; entries: LogbookPreviewEntry[] }
  pageIndex: number
  logbook: LogbookPreviewData
  ownerLabel: string
}) {
  return (
    <article className="logbook-page relative mx-auto min-h-[640px] max-w-4xl overflow-hidden rounded-lg border border-slate-200 bg-white p-6 text-slate-900 shadow-sm dark:border-slate-700">
      <div className="pointer-events-none absolute inset-0 opacity-[0.035] before:absolute before:inset-8 before:bg-contain before:bg-center before:bg-no-repeat" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: "url('/favicon-aeroaviation.webp')",
          backgroundSize: '92px 92px',
          backgroundRepeat: 'repeat',
        }}
      />
      {ownerLabel && (
        <div className="pointer-events-none absolute inset-0 flex rotate-[-24deg] items-center justify-center text-center text-3xl font-black text-slate-900 opacity-[0.045]">
          {ownerLabel}
        </div>
      )}

      <div className="relative">
        {page.kind === 'cover' ? (
          <CoverPage logbook={logbook} />
        ) : (
          <EntriesPage pageNumber={pageIndex} entries={page.entries} logbook={logbook} />
        )}
      </div>
    </article>
  )
}

function CoverPage({ logbook }: { logbook: LogbookPreviewData }) {
  return (
    <div className="flex min-h-[560px] flex-col">
      <div className="flex items-start justify-between gap-6 border-b border-slate-200 pb-5">
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase">Aerojet Academy</p>
          <h2 className="text-aerojet-blue mt-2 text-3xl font-black text-balance">
            OJT Experience Logbook
          </h2>
          <p className="mt-2 text-sm text-pretty text-slate-600">
            EASA Part-66 digital experience record
          </p>
        </div>
        <Image
          src="/favicon-aeroaviation.webp"
          alt=""
          width={64}
          height={64}
          className="size-16 object-contain opacity-80"
        />
      </div>

      <div className="grid flex-1 gap-4 py-8 sm:grid-cols-2">
        <Field label="Student" value={logbook.studentName ?? 'Student portal record'} />
        <Field label="Student ID" value={logbook.studentId ?? 'Available in staff view'} />
        <Field label="Licence category" value={logbook.licenceCategory} />
        <Field label="Facility" value={logbook.facilityName} />
        <Field label="Approval no." value={logbook.facilityApprovalNo ?? 'Not recorded'} />
        <Field label="Status" value={logbook.status} />
        <Field label="Start date" value={formatDate(logbook.startDate)} />
        <Field
          label="Target end date"
          value={logbook.targetEndDate ? formatDate(logbook.targetEndDate) : 'Open'}
        />
      </div>

      <div className="grid gap-3 border-t border-slate-200 pt-5 sm:grid-cols-4">
        <Stat label="Total hours" value={`${logbook.analytics.totalHours}h`} />
        <Stat label="Entries" value={String(logbook.entries.length)} />
        <Stat label="ATA chapters" value={String(logbook.analytics.ataChaptersCovered)} />
        <Stat label="Signed" value={String(logbook.analytics.signedEntries)} />
      </div>
    </div>
  )
}

function EntriesPage({
  pageNumber,
  entries,
  logbook,
}: {
  pageNumber: number
  entries: LogbookPreviewEntry[]
  logbook: LogbookPreviewData
}) {
  return (
    <div className="min-h-[560px]">
      <div className="mb-5 flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase">Aerojet Academy</p>
          <h3 className="mt-1 text-xl font-black text-balance text-slate-900">
            Experience entries
          </h3>
        </div>
        <div className="text-right text-xs text-slate-500">
          <div>{logbook.licenceCategory}</div>
          <div className="tabular-nums">Sheet {pageNumber}</div>
        </div>
      </div>

      <div className="space-y-4">
        {entries.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            No entries recorded yet.
          </div>
        ) : (
          entries.map((entry, index) => (
            <div key={entry.id} className="rounded-lg border border-slate-200 p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-bold text-slate-900">Entry {index + 1}</span>
                <span>{formatDate(entry.date)}</span>
                <span>
                  {entry.aircraftType} / {entry.aircraftRegistration}
                </span>
                <span className="rounded bg-slate-100 px-2 py-0.5 font-bold text-slate-700">
                  ATA {entry.ataChapter.code}
                </span>
                <span className="ml-auto tabular-nums">{entry.durationHours}h</span>
              </div>
              <p className="text-sm font-semibold text-pretty text-slate-900">
                {entry.taskDescription}
              </p>
              <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
                <Field label="Type" value={entry.maintenanceType.replace(/_/g, ' ')} compact />
                <Field
                  label="Manual"
                  value={entry.maintenanceManualRef ?? 'Not recorded'}
                  compact
                />
                <Field
                  label="Work order"
                  value={entry.workOrderReference ?? 'Not recorded'}
                  compact
                />
                <Field
                  label="Environment"
                  value={entry.workEnvironment ?? 'Not recorded'}
                  compact
                />
                <Field label="Tools" value={entry.toolsUsed ?? 'Not recorded'} compact />
                <Field
                  label="Competency"
                  value={entry.competencyRating ? `${entry.competencyRating}/5` : 'Not rated'}
                  compact
                />
              </div>
              <div className="mt-3 grid gap-2 border-t border-slate-100 pt-3 text-xs sm:grid-cols-3">
                <Signature label="Supervisor" signed={entry.supervisorSignature} />
                <Signature label="Student" signed={entry.studentSignature} />
                <Signature label="Management" signed={entry.verifiedByManagement} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  compact = false,
}: {
  label: string
  value: string | null
  compact?: boolean
}) {
  return (
    <div>
      <div className="text-xs font-bold text-slate-500 uppercase">{label}</div>
      <div
        className={cn(
          'mt-1 font-semibold text-pretty text-slate-900',
          compact ? 'text-xs' : 'text-sm'
        )}
      >
        {value || 'Not recorded'}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <div className="text-xs font-bold text-slate-500 uppercase">{label}</div>
      <div className="mt-1 text-xl font-black text-slate-900 tabular-nums">{value}</div>
    </div>
  )
}

function Signature({ label, signed }: { label: string; signed: boolean }) {
  return (
    <div className="flex items-center justify-between rounded border border-slate-200 px-3 py-2">
      <span className="font-semibold text-slate-700">{label}</span>
      <span className={cn('font-bold', signed ? 'text-emerald-700' : 'text-slate-400')}>
        {signed ? 'Signed' : 'Pending'}
      </span>
    </div>
  )
}

function buildPages(logbook: LogbookPreviewData) {
  const pages: Array<{ kind: 'cover' } | { kind: 'entries'; entries: LogbookPreviewEntry[] }> = [
    { kind: 'cover' },
  ]
  const chunkSize = 3
  for (let index = 0; index < logbook.entries.length; index += chunkSize) {
    pages.push({ kind: 'entries', entries: logbook.entries.slice(index, index + chunkSize) })
  }
  if (pages.length === 1) pages.push({ kind: 'entries', entries: [] })
  return pages
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}
