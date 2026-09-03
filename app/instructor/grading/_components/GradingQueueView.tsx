'use client'

import React, { useMemo, useState } from 'react'
import {
  Search,
  Filter,
  ClipboardCheck,
  User as UserIcon,
  BookOpen,
  Calendar,
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const MotionDiv = motion.div
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { format } from 'date-fns'
import { submitGrade } from '@/lib/actions/instructor'
import { toast } from 'sonner'
import TablePagination from '@/components/shared/TablePagination'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

interface PendingGrade {
  id: string
  assessmentName: string
  assessmentType: string
  assessmentDate: string
  user: {
    profile: {
      firstName: string
      lastName: string
    } | null
  }
  enrollment: {
    course: {
      code: string
      name: string
    }
  }
}

interface GradingQueueViewProps {
  initialQueue: PendingGrade[]
}

export default function GradingQueueView({ initialQueue }: GradingQueueViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGrade, setSelectedGrade] = useState<PendingGrade | null>(null)
  const [score, setScore] = useState<string>('')
  const [comments, setComments] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)

  const filteredQueue = useMemo(() => {
    return initialQueue.filter((item) => {
      const lowerQuery = searchQuery.toLowerCase()
      const studentName =
        `${item.user.profile?.firstName} ${item.user.profile?.lastName}`.toLowerCase()
      return (
        studentName.includes(lowerQuery) ||
        item.assessmentName.toLowerCase().includes(lowerQuery) ||
        item.enrollment.course.code.toLowerCase().includes(lowerQuery) ||
        item.enrollment.course.name.toLowerCase().includes(lowerQuery)
      )
    })
  }, [initialQueue, searchQuery])

  const total = filteredQueue.length
  const paged = filteredQueue.slice((page - 1) * perPage, page * perPage)

  const handleGradeSubmit = async () => {
    if (!selectedGrade || !score) return

    const scoreNum = parseFloat(score)
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      toast.error('Please enter a valid score between 0 and 100')
      return
    }

    setIsSubmitting(true)
    try {
      await submitGrade({
        gradeId: selectedGrade.id,
        score: scoreNum,
        comments,
      })
      toast.success(`Grade submitted for ${selectedGrade.user.profile?.firstName || 'Student'}`)
      setSelectedGrade(null)
      setScore('')
      setComments('')
    } catch (error) {
      toast.error('Failed to submit grade. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col space-y-8">
      {/* Search Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-xl flex-1">
          <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-300" />
          <Input
            placeholder="Search by student, assessment, or module..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="focus:border-aerojet-sky h-14 rounded-2xl border-slate-100 bg-white pl-11 text-sm font-medium shadow-sm transition-all focus:ring-4 focus:ring-blue-50/50 dark:border-slate-800 dark:bg-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-500 uppercase">
          <ClipboardCheck className="text-aerojet-sky h-4 w-4" />
          <span>{filteredQueue.length} Pending Submissions</span>
        </div>
      </div>

      {/* Queue List */}
      <div className="grid gap-4">
        <AnimatePresence mode="popLayout">
          {filteredQueue.length > 0 ? (
            paged.map((item: PendingGrade) => (
              <MotionDiv
                key={item.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="group hover:border-aerojet-sky/30 overflow-hidden rounded-3xl border-slate-100 bg-white transition-all hover:shadow-xl hover:shadow-blue-500/5 dark:border-slate-800 dark:bg-slate-900">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row md:items-center">
                      {/* Left: Module Info */}
                      <div className="flex items-center gap-4 border-b border-slate-50 p-6 md:w-64 md:border-r md:border-b-0 dark:border-slate-800/50">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-900/20">
                          <BookOpen className="text-aerojet-sky h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-aerojet-sky text-[10px] font-black tracking-widest uppercase">
                            {item.enrollment.course.code}
                          </p>
                          <h4 className="line-clamp-1 text-sm font-black text-slate-900 dark:text-white">
                            {item.enrollment.course.name}
                          </h4>
                        </div>
                      </div>

                      {/* Middle: Assessment Info */}
                      <div className="flex-1 space-y-4 p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="rounded-full border-slate-100 bg-slate-50 px-2 py-0 text-[10px] font-bold text-slate-500 dark:border-slate-800 dark:bg-slate-800/50"
                              >
                                {item.assessmentType}
                              </Badge>
                              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                {item.assessmentName}
                              </h3>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                              <div className="flex items-center gap-1.5">
                                <UserIcon className="h-3.5 w-3.5" />
                                <span>
                                  {item.user.profile?.firstName} {item.user.profile?.lastName}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>{format(new Date(item.assessmentDate), 'MMM d, yyyy')}</span>
                              </div>
                            </div>
                          </div>

                          <Button
                            onClick={() => setSelectedGrade(item)}
                            className="bg-aerojet-blue rounded-xl px-6 font-black text-white hover:bg-[#003a7c] dark:bg-blue-600 dark:hover:bg-blue-700"
                          >
                            Grade Now
                            <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </MotionDiv>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center rounded-4xl border border-dashed border-slate-200 py-32 dark:border-slate-800">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-50 dark:bg-slate-800/50">
                <CheckCircle2 className="h-10 w-10 text-slate-200 dark:text-slate-700" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">All caught up!</h3>
              <p className="mt-2 text-sm font-medium text-slate-400">
                No submissions are currently awaiting your feedback.
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {total > 0 && (
        <TablePagination
          page={page}
          perPage={perPage}
          total={total}
          onPageChange={setPage}
          onPerPageChange={setPerPage}
        />
      )}

      {/* Grading Dialog */}
      <Dialog open={!!selectedGrade} onOpenChange={(open) => !open && setSelectedGrade(null)}>
        <DialogContent className="max-w-lg overflow-hidden rounded-4xl border-none p-0">
          <div className="bg-aerojet-blue p-8 text-white dark:bg-slate-900">
            <DialogHeader className="space-y-1">
              <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-blue-300 uppercase">
                <ClipboardCheck className="h-4 w-4" />
                Assessment Grading
              </div>
              <DialogTitle className="text-3xl font-black">
                {selectedGrade?.assessmentName}
              </DialogTitle>
              <DialogDescription className="text-blue-100/70">
                Grading submission for{' '}
                <span className="font-bold text-white">
                  {selectedGrade?.user.profile?.firstName} {selectedGrade?.user.profile?.lastName}
                </span>
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="space-y-8 p-8">
            <div className="grid gap-6">
              <div className="space-y-3">
                <Label
                  htmlFor="score"
                  className="text-xs font-black tracking-widest text-slate-400 uppercase"
                >
                  Assessment Score (%)
                </Label>
                <div className="relative">
                  <Input
                    id="score"
                    type="number"
                    placeholder="0-100"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
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
                  className="text-xs font-black tracking-widest text-slate-400 uppercase"
                >
                  Feedback & Comments
                </Label>
                <textarea
                  id="comments"
                  rows={4}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Provide constructive feedback for the student..."
                  className="focus:border-aerojet-sky w-full rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-medium focus:ring-4 focus:ring-blue-50/50 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                />
              </div>
            </div>

            <DialogFooter className="flex-col gap-3 sm:flex-col">
              <Button
                onClick={handleGradeSubmit}
                disabled={isSubmitting || !score}
                className="bg-aerojet-sky h-14 w-full rounded-2xl text-base font-black text-white hover:bg-[#3b8dcd] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Submitting...
                  </span>
                ) : (
                  'Confirm & Submit Grade'
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setSelectedGrade(null)}
                className="h-12 w-full rounded-2xl font-bold text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Cancel
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
