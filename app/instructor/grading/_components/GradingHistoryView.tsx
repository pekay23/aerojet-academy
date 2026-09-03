'use client'

import React, { useMemo, useState } from 'react'
import {
  Search,
  History,
  User as UserIcon,
  BookOpen,
  Calendar,
  ChevronRight,
  Edit2,
  CheckCircle2,
  Clock,
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

interface GradedItem {
  id: string
  assessmentName: string
  assessmentType: string
  score: number
  comments?: string | null
  updatedAt: string
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

interface GradingHistoryViewProps {
  initialHistory: GradedItem[]
}

export default function GradingHistoryView({ initialHistory }: GradingHistoryViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGrade, setSelectedGrade] = useState<GradedItem | null>(null)
  const [score, setScore] = useState<string>('')
  const [comments, setComments] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)

  const filteredHistory = useMemo(() => {
    return initialHistory.filter((item) => {
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
  }, [initialHistory, searchQuery])

  const total = filteredHistory.length
  const paged = filteredHistory.slice((page - 1) * perPage, page * perPage)

  const handleEditSubmit = async () => {
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
      toast.success(`Grade updated for ${selectedGrade.user.profile?.firstName || 'Student'}`)
      setSelectedGrade(null)
    } catch (error) {
      toast.error('Failed to update grade. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditModal = (item: GradedItem) => {
    setSelectedGrade(item)
    setScore(item.score.toString())
    setComments(item.comments || '')
  }

  return (
    <div className="flex flex-col space-y-8">
      {/* Search Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-xl flex-1">
          <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-300" />
          <Input
            placeholder="Search history by student, assessment, or module..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="focus:border-aerojet-sky h-14 rounded-2xl border-slate-100 bg-white pl-11 text-sm font-medium shadow-sm transition-all focus:ring-4 focus:ring-blue-50/50 dark:border-slate-800 dark:bg-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-500 uppercase">
          <History className="text-aerojet-sky h-4 w-4" />
          <span>{total} Graded Assessments</span>
        </div>
      </div>

      {/* History List */}
      <div className="grid gap-4">
        <AnimatePresence mode="popLayout">
          {initialHistory.length > 0 ? (
            initialHistory.map((item) => (
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
                      {/* Left: Score Badge */}
                      <div className="flex flex-col items-center justify-center gap-1 border-b border-slate-50 p-6 md:w-32 md:border-r md:border-b-0 dark:border-slate-800/50">
                        <span className="text-aerojet-sky text-2xl font-black">{item.score}%</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase">
                          Score
                        </span>
                      </div>

                      {/* Middle: Content */}
                      <div className="flex-1 space-y-2 p-6">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-aerojet-sky text-[10px] font-black tracking-widest uppercase">
                            {item.enrollment.course.code}
                          </p>
                          <span className="text-slate-200">|</span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {item.assessmentName}
                          </span>
                        </div>

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="space-y-1">
                            <h3 className="line-clamp-1 text-lg font-black text-slate-900 dark:text-white">
                              {item.user.profile?.firstName} {item.user.profile?.lastName}
                            </h3>
                            <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" />
                                <span>
                                  Graded on {format(new Date(item.updatedAt), 'MMM d, yyyy')}
                                </span>
                              </div>
                            </div>
                          </div>

                          <Button
                            variant="outline"
                            onClick={() => openEditModal(item)}
                            className="hover:border-aerojet-sky hover:text-aerojet-sky rounded-xl border-slate-100 font-bold transition-all hover:bg-blue-50 dark:border-slate-800 dark:hover:bg-blue-900/20"
                          >
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edit Grade
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
                <History className="h-10 w-10 text-slate-200 dark:text-slate-700" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">No history yet</h3>
              <p className="mt-2 text-sm font-medium text-slate-400">
                Assessments you grade will appear here.
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

      {/* Edit Grading Dialog */}
      <Dialog open={!!selectedGrade} onOpenChange={(open) => !open && setSelectedGrade(null)}>
        <DialogContent className="max-w-lg overflow-hidden rounded-4xl border-none p-0">
          <div className="bg-slate-900 p-8 text-white">
            <DialogHeader className="space-y-1">
              <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-blue-300 uppercase">
                <Edit2 className="h-4 w-4" />
                Edit Grade Entry
              </div>
              <DialogTitle className="text-3xl font-black">Update Score</DialogTitle>
              <DialogDescription className="text-slate-400">
                Adjusting results for{' '}
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
                  New Score (%)
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
                  Updated Feedback
                </Label>
                <textarea
                  id="comments"
                  rows={4}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Update your feedback for the student..."
                  className="focus:border-aerojet-sky w-full rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-medium focus:ring-4 focus:ring-blue-50/50 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                />
              </div>
            </div>

            <DialogFooter className="flex-col gap-3 sm:flex-col">
              <Button
                onClick={handleEditSubmit}
                disabled={isSubmitting || !score}
                className="bg-aerojet-blue h-14 w-full rounded-2xl text-base font-black text-white hover:bg-[#003a7c] disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Updating...
                  </span>
                ) : (
                  'Save Changes'
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setSelectedGrade(null)}
                className="h-12 w-full rounded-2xl font-bold text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Go Back
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
