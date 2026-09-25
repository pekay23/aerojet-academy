'use client'

import { useState } from 'react'
import { CalendarDays, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { triggerSittingGeneration } from './actions'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface Props {
  eventId: string
}

export default function GenerateSittingsButton({ eventId }: Props) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const result = await triggerSittingGeneration(eventId)
      if (!result.success) {
        toast.error(result.error || 'Failed to generate sittings')
        return
      }
      toast.success(result.message)
      setOpen(false)
    } catch (_error) {
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <AlertDialogTrigger asChild>
            <button
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CalendarDays className="h-4 w-4" />
              )}
              Generate Sittings
            </button>
          </AlertDialogTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="center" className="max-w-75 text-xs">
          <p>
            Automatically distribute pooled candidates into timed exam sessions based on examiner
            availability and capacity.
          </p>
        </TooltipContent>
      </Tooltip>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Generate Exam Sittings?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will automatically distribute all currently pooled candidates into specific
            timed sessions. Existing manual assignments are preserved, but new sessions will be
            created to accommodate pending demand.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleGenerate()
            }}
            disabled={loading}
            className="bg-emerald-600 font-bold text-white hover:bg-emerald-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Confirm & Generate'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
