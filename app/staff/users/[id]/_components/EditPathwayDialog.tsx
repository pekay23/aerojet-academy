'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Edit2, Loader2, AlertTriangle } from 'lucide-react'

export type PathwayCode = 'FULL_TIME_4Y' | 'FULL_TIME_2Y' | 'MILITARY_1Y' | 'MODULAR' | 'EXAM_ONLY' | null

export default function EditPathwayDialog({
  userId,
  currentPathway,
  isLocked,
}: {
  userId: string
  currentPathway: PathwayCode
  isLocked: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pathway, setPathway] = useState<PathwayCode>(currentPathway)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!reason) {
      setError('You must provide a reason for this change.')
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/staff/students/${userId}/study-pathway`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pathwayCode: pathway, reason }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update pathway')
      }

      setOpen(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="ml-2 text-slate-400 hover:text-blue-500">
          <Edit2 className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isLocked ? 'Override Study Pathway' : 'Assign Study Pathway'}</DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/10">
            <h4 className="flex items-center gap-2 text-sm font-bold text-orange-800 dark:text-orange-400">
              <AlertTriangle className="h-4 w-4" /> Administrative Override
            </h4>
            <p className="mt-2 text-xs text-orange-700 dark:text-orange-300">
              {isLocked
                ? "This student's pathway is locked. Changing it may disrupt their existing enrollments or wallet reservations."
                : 'This student has not selected a pathway yet. You can assign one here.'}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Select Pathway
            </label>
            <select
              value={pathway || ''}
              onChange={(e) => setPathway(e.target.value as PathwayCode)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="" disabled>
                Select Pathway
              </option>
              <option value="FULL_TIME_4Y">Full-Time 4 Year (B1+B2)</option>
              <option value="FULL_TIME_2Y">Full-Time 2 Year (B1)</option>
              <option value="MILITARY_1Y">Military 1 Year (B1)</option>
              <option value="MODULAR">Modular</option>
              <option value="EXAM_ONLY">Exam-Only</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Reason for Change
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Student requested migration from Modular to Full-Time"
              required
              rows={3}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>

        <div className="mt-4 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSubmitting || !pathway || pathway === currentPathway || !reason}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Pathway'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
