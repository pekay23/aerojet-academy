'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { ArrowRight, Eye, PlayCircle } from 'lucide-react'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { previewAdvancement, runAdvancement } from '@/lib/progression/actions'

interface Opt {
  id: string
  name: string
  code?: string
}

export default function AdvancementForm({
  pathways,
  academicYears,
  isAdmin,
}: {
  pathways: Opt[]
  academicYears: Opt[]
  isAdmin: boolean
}) {
  const [pathwayId, setPathwayId] = useState('')
  const [academicYearId, setAcademicYearId] = useState('')
  const [fromYear, setFromYear] = useState(1)
  const [fromSemester, setFromSemester] = useState(1)
  const [holdRaw, setHoldRaw] = useState('')
  const [preview, setPreview] = useState<{ count: number; to: { year: number; semester: number } } | null>(
    null
  )
  const [isPending, startTransition] = useTransition()
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    onConfirm: () => void
  }>({ open: false, onConfirm: () => {} })

  const base = () => ({
    pathwayId: pathwayId || undefined,
    academicYearId: academicYearId || undefined,
    fromYear,
    fromSemester,
  })

  const doPreview = () =>
    startTransition(async () => {
      setPreview(null)
      const res = await previewAdvancement(base())
      if (res.error) toast.error(res.error)
      else setPreview({ count: res.count!, to: res.to! })
    })

  const doRun = () => {
    if (!preview) {
      toast.error('Run a preview first.')
      return
    }
    setConfirmDialog({
      open: true,
      onConfirm: () => {
        setConfirmDialog((d) => ({ ...d, open: false }))
        const holdUserIds = holdRaw
          .split(/[\s,]+/)
          .map((s) => s.trim())
          .filter(Boolean)
        startTransition(async () => {
          const res = await runAdvancement({ ...base(), holdUserIds })
          if (res.error) toast.error(res.error)
          else {
            toast.success(`Advanced ${res.advanced}, held ${res.held}`)
            setPreview(null)
          }
        })
      },
    })
  }

  return (
    <div className="space-y-5 rounded-2xl border border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block font-bold text-slate-600 dark:text-slate-300">Pathway (optional)</span>
          <select
            value={pathwayId}
            onChange={(e) => setPathwayId(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="">All pathways</option>
            {pathways.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-bold text-slate-600 dark:text-slate-300">Academic Year (optional)</span>
          <select
            value={academicYearId}
            onChange={(e) => setAcademicYearId(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="">Any</option>
            {academicYears.map((y) => (
              <option key={y.id} value={y.id}>
                {y.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-bold text-slate-600 dark:text-slate-300">From Year</span>
          <input
            type="number"
            min={1}
            value={fromYear}
            onChange={(e) => setFromYear(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-bold text-slate-600 dark:text-slate-300">From Semester</span>
          <select
            value={fromSemester}
            onChange={(e) => setFromSemester(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <option value={1}>Semester 1</option>
            <option value={2}>Semester 2</option>
          </select>
        </label>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block font-bold text-slate-600 dark:text-slate-300">
          Hold back (optional) — student user IDs, comma/space separated
        </span>
        <textarea
          value={holdRaw}
          onChange={(e) => setHoldRaw(e.target.value)}
          rows={2}
          placeholder="userId1, userId2 …"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        />
      </label>

      {preview && (
        <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-200">
          <span className="font-bold">{preview.count}</span> student(s)
          <ArrowRight className="h-4 w-4" />
          Year {preview.to.year}, Semester {preview.to.semester}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={doPreview}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:border-slate-300 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300"
        >
          <Eye className="h-4 w-4" /> Preview
        </button>
        {isAdmin ? (
          <button
            onClick={doRun}
            disabled={isPending || !preview}
            className="flex items-center gap-1.5 rounded-xl bg-aerojet-blue px-4 py-2 text-sm font-bold text-white hover:bg-aerojet-blue/90 disabled:opacity-50"
          >
            <PlayCircle className="h-4 w-4" /> Run Advancement
          </button>
        ) : (
          <span className="self-center text-xs text-slate-400">
            Only an administrator can execute an advancement run.
          </span>
        )}
      </div>

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((d) => ({ ...d, open }))}
        title="Confirm Advancement"
        description={`Advance ${preview?.count || 0} student(s) to Year ${preview?.to.year || '?'}, Semester ${preview?.to.semester || '?'}?`}
        confirmLabel="Advance"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={confirmDialog.onConfirm}
      />
    </div>
  )
}
