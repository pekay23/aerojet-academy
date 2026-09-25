'use client'

import { useState, useTransition } from 'react'
import {
  Users,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface SpareCapacitySitting {
  sittingId: string
  moduleCode: string | null
  dayNumber: number
  sessionType: string
  capacity: number
  assignedCount: number
  spareSeats: number
}

interface ResitCandidate {
  bookingId: string
  userId: string
  userName: string | null
  moduleCode: string | null
}

interface ResitBackfillProposal {
  sittingId: string
  bookingId: string
  userId: string
  moduleCode: string | null
  reason: string
}

interface ResitBackfillResult {
  eventId: string
  spareCapacitySittings: SpareCapacitySitting[]
  eligibleResitCandidates: ResitCandidate[]
  proposals: ResitBackfillProposal[]
  warnings: string[]
}

export default function ResitBackfillPanel({ eventId }: { eventId: string }) {
  const [result, setResult] = useState<ResitBackfillResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [executing, startTransition] = useTransition()
  const [expanded, setExpanded] = useState(false)
  const router = useRouter()

  const fetchProposals = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/staff/resit-backfill?eventId=${eventId}`)
      if (!res.ok) throw new Error('Failed to fetch proposals')
      const data = await res.json()
      setResult(data)
      setExpanded(true)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch proposals'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleExecute = async () => {
    if (!result || result.proposals.length === 0) return

    startTransition(async () => {
      try {
        const res = await fetch('/api/staff/resit-backfill', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId,
            proposals: result.proposals,
          }),
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to execute backfill')

        toast.success(data.message)
        setResult(null)
        setExpanded(false)
        // Revalidate would happen via the API route's revalidatePath
        // But we might need a router refresh if the parent doesn't auto-update
        router.refresh()
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to execute backfill'
        toast.error(message)
      }
    })
  }

  if (!result && !loading) {
    return (
      <div className="rounded-2xl border border-blue-100 bg-blue-50/30 p-6 dark:border-blue-900/30 dark:bg-blue-900/10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-blue-900 dark:text-blue-300">
                Resit Backfill Optimization
              </h3>
              <p className="text-sm text-blue-700/70 dark:text-blue-400/60">
                Identify spare capacity and automatically match resit candidates.
              </p>
            </div>
          </div>
          <button
            onClick={fetchProposals}
            disabled={loading}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-blue-700 disabled:opacity-50"
          >
            Check for Opportunities
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-slate-100 bg-white p-12 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm font-medium text-slate-500">
            Analyzing spare capacity and candidates...
          </p>
        </div>
      </div>
    )
  }

  if (!result) return null

  const canExecute = result.proposals.length > 0

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/30">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
            <Users className="h-4 w-4" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-slate-100">Backfill Proposals</h3>
          {canExecute && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              {result.proposals.length} matches
            </span>
          )}
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
      </div>

      {expanded && (
        <div className="p-6">
          {result.warnings.length > 0 && (
            <div className="mb-6 space-y-2">
              {result.warnings.map((warning, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-900/20 dark:text-amber-400"
                >
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {warning}
                </div>
              ))}
            </div>
          )}

          {result.proposals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="mb-3 h-10 w-10 text-slate-200 dark:text-slate-800" />
              <p className="text-sm font-medium text-slate-500">
                No new backfill opportunities found.
              </p>
              <p className="mt-1 text-xs text-slate-400">
                All resit candidates are either assigned or no compatible seats exist.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-4 px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                <div className="col-span-5">Candidate</div>
                <div className="col-span-2">Module</div>
                <div className="col-span-5">Target Sitting</div>
              </div>
              <div className="max-h-75 space-y-2 overflow-y-auto pr-2">
                {result.proposals.map((proposal, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-12 items-center gap-4 rounded-xl border border-slate-100 p-3 text-sm dark:border-slate-800"
                  >
                    <div className="col-span-5 font-medium text-slate-700 dark:text-slate-300">
                      {result.eligibleResitCandidates.find(
                        (c) => c.bookingId === proposal.bookingId
                      )?.userName || 'Unknown'}
                    </div>
                    <div className="col-span-2">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        {proposal.moduleCode}
                      </span>
                    </div>
                    <div className="col-span-5 flex items-center gap-2 text-xs text-slate-500">
                      <ArrowRight className="h-3 w-3 text-slate-300" />
                      <span className="truncate">{proposal.reason}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-6 dark:border-slate-800">
                <div className="text-xs text-slate-400">
                  Matches are made by same-module first, ensuring no candidate overlaps.
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setResult(null)
                      setExpanded(false)
                    }}
                    className="rounded-xl px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExecute}
                    disabled={executing}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2 text-sm font-bold text-white transition-all hover:bg-blue-700 disabled:opacity-50"
                  >
                    {executing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    Apply {result.proposals.length} Assignments
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
