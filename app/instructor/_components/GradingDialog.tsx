'use client'

import { useState } from 'react'
import { useFormDirty } from '@/hooks/useFormDirty'
import { toast } from 'sonner'
import { submitGrade } from '@/lib/actions/instructor'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface GradingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  grade: {
    id: string
    assessmentName: string
    user: {
      profile: {
        firstName: string | null
        lastName: string | null
      } | null
    }
  } | null | null | null
  mode: 'submit' | 'edit'
  onSuccess?: () => void
}

export default function GradingDialog({
  open,
  onOpenChange,
  grade,
  mode,
  onSuccess,
}: GradingDialogProps) {
  const [score, setScore] = useState('')
  const [comments, setComments] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { markDirty, markClean } = useFormDirty()

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setScore('')
      setComments('')
    }
    onOpenChange(newOpen)
  }

  const handleSubmit = async () => {
    if (!grade || !score) return

    const scoreNum = parseFloat(score)
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      toast.error('Please enter a valid score between 0 and 100')
      return
    }

    setIsSubmitting(true)
    try {
      await submitGrade({
        gradeId: grade.id,
        score: scoreNum,
        comments,
      })
      toast.success(
        mode === 'edit'
          ? `Grade updated for ${grade.user.profile?.firstName || 'Student'}`
          : `Grade submitted for ${grade.user.profile?.firstName || 'Student'}`
      )
      markClean()
      handleOpenChange(false)
      onSuccess?.()
    } catch (err) {
      console.error('[GradingDialog] Failed to submit grade:', err)
      toast.error('Failed to submit grade. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg overflow-hidden rounded-4xl border-none p-0">
        <div className={cn('p-8 text-white', mode === 'edit' ? 'bg-slate-900' : 'bg-aerojet-blue')}>
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-blue-300 uppercase">
              {mode === 'edit' ? 'Edit Grade Entry' : 'Assessment Grading'}
            </div>
            <DialogTitle className="text-3xl font-black">
              {mode === 'edit' ? 'Update Score' : grade?.assessmentName}
            </DialogTitle>
            <DialogDescription
              className={cn(
                mode === 'edit' ? 'text-slate-400 dark:text-slate-300' : 'text-blue-100/70'
              )}
            >
              {mode === 'edit' ? (
                <>
                  Adjusting results for{' '}
                  <span className="font-bold text-white">
                    {grade?.user?.profile?.firstName} {grade?.user?.profile?.lastName}
                  </span>
                </>
              ) : (
                <>
                  Grading submission for{' '}
                  <span className="font-bold text-white">
                    {grade?.user?.profile?.firstName} {grade?.user?.profile?.lastName}
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-8 p-8">
          <div className="grid gap-6">
            <div className="space-y-3">
              <Label
                htmlFor="score"
                className="text-xs font-black tracking-widest text-slate-400 uppercase dark:text-slate-300"
              >
                {mode === 'edit' ? 'New Score (%)' : 'Assessment Score (%)'}
              </Label>
              <div className="relative">
                <Input
                  id="score"
                  type="number"
                  placeholder="0-100"
                  value={score}
                  onChange={(e) => {
                    setScore(e.target.value)
                    markDirty()
                  }}
                  className="h-16 rounded-2xl border-slate-100 bg-slate-50 text-2xl font-black placeholder:text-slate-200 dark:border-slate-800 dark:bg-slate-900"
                  min="0"
                  max="100"
                />
                <div className="absolute top-1/2 right-6 -translate-y-1/2 text-xl font-black text-slate-300">
                  %
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label
                htmlFor="comments"
                className="text-xs font-black tracking-widest text-slate-400 uppercase dark:text-slate-300"
              >
                {mode === 'edit' ? 'Updated Feedback' : 'Feedback & Comments'}
              </Label>
              <textarea
                id="comments"
                rows={4}
                value={comments}
                onChange={(e) => {
                  setComments(e.target.value)
                  markDirty()
                }}
                placeholder={
                  mode === 'edit'
                    ? 'Update your feedback for the student...'
                    : 'Provide constructive feedback for the student...'
                }
                className="focus:border-aerojet-sky w-full rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-medium focus:ring-4 focus:ring-blue-50/50 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
              />
            </div>
          </div>

          <DialogFooter className="flex-col gap-3 sm:flex-col">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !score}
              className="bg-aerojet-sky h-14 w-full rounded-2xl text-base font-black text-white hover:bg-[#3b8dcd] disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {mode === 'edit' ? 'Updating...' : 'Submitting...'}
                </span>
              ) : mode === 'edit' ? (
                'Save Changes'
              ) : (
                'Confirm & Submit Grade'
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              className="h-12 w-full rounded-2xl font-bold text-slate-400 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            >
              {mode === 'edit' ? 'Go Back' : 'Cancel'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
