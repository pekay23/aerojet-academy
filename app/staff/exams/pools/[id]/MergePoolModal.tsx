'use client'

import { useState } from 'react'
import { GitMerge, AlertTriangle, CheckCircle, Loader2, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useRouter } from 'next/navigation'

interface Pool {
  id: string
  name: string
  currentMemberCount: number
  maxCandidates: number
  status: string
  allowedModules: string[]
}

interface MergePoolModalProps {
  currentPool: Pool
  eventPools: Pool[] // All other OPEN/NEAR_FULL pools in the same event
}

type ValidationResult = {
  compatible: boolean
  reason: string
}

export function MergePoolModal({ currentPool, eventPools }: MergePoolModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selectedPoolId, setSelectedPoolId] = useState('')
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isMerging, setIsMerging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const candidatePools = eventPools.filter(
    (p) =>
      p.id !== currentPool.id &&
      ['OPEN', 'NEAR_FULL', 'DRAFT'].includes(p.status)
  )

  const handleValidate = async () => {
    if (!selectedPoolId) return
    setIsValidating(true)
    setValidation(null)
    setError(null)

    try {
      const res = await fetch('/api/staff/exam-pools/merge', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poolAId: currentPool.id, poolBId: selectedPoolId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Validation failed')
      } else {
        setValidation(data)
      }
    } catch {
      setError('Network error during validation')
    } finally {
      setIsValidating(false)
    }
  }

  const handleMerge = async () => {
    if (!selectedPoolId || !validation?.compatible) return
    setIsMerging(true)
    setError(null)

    try {
      const res = await fetch('/api/staff/exam-pools/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poolAId: currentPool.id, poolBId: selectedPoolId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Merge failed')
      } else {
        setSuccess(true)
        setTimeout(() => {
          setOpen(false)
          router.refresh()
        }, 1500)
      }
    } catch {
      setError('Network error during merge')
    } finally {
      setIsMerging(false)
    }
  }

  const handleClose = () => {
    setOpen(false)
    setSelectedPoolId('')
    setValidation(null)
    setError(null)
    setSuccess(false)
  }

  const selectedPool = candidatePools.find((p) => p.id === selectedPoolId)

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true) }}>
      <DialogTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-700 transition-all duration-150 ease-out hover:border-amber-300 hover:bg-amber-100 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-400 dark:hover:bg-amber-900/20"
          disabled={candidatePools.length === 0}
          title={candidatePools.length === 0 ? 'No compatible pools available to merge' : 'Merge another pool into this one'}
        >
          <GitMerge className="h-4 w-4" />
          Merge Pool
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-black text-aerojet-blue">
            <GitMerge className="h-5 w-5" />
            Merge Pool Into: {currentPool.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Current Pool Summary */}
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/20 dark:bg-blue-900/10">
            <p className="mb-1 text-xs font-black uppercase tracking-wider text-blue-600">Target Pool (Receives candidates)</p>
            <p className="font-bold text-aerojet-blue dark:text-blue-300">{currentPool.name}</p>
            <p className="text-xs text-blue-500">
              {currentPool.currentMemberCount}/{currentPool.maxCandidates} candidates ·{' '}
              {currentPool.allowedModules.join(', ') || 'No modules'}
            </p>
          </div>

          {/* Pool Selector */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
              Select Pool to Absorb
            </label>
            {candidatePools.length === 0 ? (
              <p className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-400 dark:border-slate-800 dark:bg-slate-800/30">
                No OPEN or NEAR_FULL pools available in this event.
              </p>
            ) : (
              <select
                value={selectedPoolId}
                onChange={(e) => {
                  setSelectedPoolId(e.target.value)
                  setValidation(null)
                  setError(null)
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 shadow-sm focus:border-aerojet-blue focus:outline-none focus:ring-2 focus:ring-aerojet-blue/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="">— Select a pool —</option>
                {candidatePools.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.currentMemberCount}/{p.maxCandidates}) — {p.status}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Selected pool summary */}
          {selectedPool && (
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
              <p className="mb-1 text-xs font-black uppercase tracking-wider text-slate-500">Pool to be Absorbed (Closed after merge)</p>
              <p className="font-bold text-slate-800 dark:text-slate-100">{selectedPool.name}</p>
              <p className="text-xs text-slate-500">
                {selectedPool.currentMemberCount}/{selectedPool.maxCandidates} candidates ·{' '}
                {selectedPool.allowedModules.join(', ') || 'No modules'}
              </p>
            </div>
          )}

          {/* Validation result */}
          {validation && (
            <div
              className={`flex items-start gap-3 rounded-xl border p-4 ${
                validation.compatible
                  ? 'border-emerald-100 bg-emerald-50 dark:border-emerald-900/20 dark:bg-emerald-900/10'
                  : 'border-red-100 bg-red-50 dark:border-red-900/20 dark:bg-red-900/10'
              }`}
            >
              {validation.compatible ? (
                <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
              )}
              <div>
                <p className={`text-xs font-black uppercase ${validation.compatible ? 'text-emerald-600' : 'text-red-600'}`}>
                  {validation.compatible ? 'Compatible — Safe to Merge' : 'Incompatible'}
                </p>
                <p className={`mt-0.5 text-sm font-medium ${validation.compatible ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
                  {validation.reason}
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-700 dark:border-red-900/20 dark:bg-red-900/10 dark:text-red-400">
              <X className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
              <CheckCircle className="h-4 w-4 shrink-0" />
              Merge complete! Refreshing pool details...
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={handleClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Cancel
            </button>

            {!validation?.compatible && (
              <button
                onClick={handleValidate}
                disabled={!selectedPoolId || isValidating}
                className="flex items-center gap-2 rounded-xl bg-slate-700 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
              >
                {isValidating && <Loader2 className="h-4 w-4 animate-spin" />}
                Validate Merge
              </button>
            )}

            {validation?.compatible && (
              <button
                onClick={handleMerge}
                disabled={isMerging || success}
                className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
              >
                {isMerging && <Loader2 className="h-4 w-4 animate-spin" />}
                <GitMerge className="h-4 w-4" />
                Execute Merge
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
