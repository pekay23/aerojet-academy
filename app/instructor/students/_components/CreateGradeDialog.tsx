import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFormDirty } from '@/hooks/useFormDirty'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PlusCircle } from 'lucide-react'
import { toast } from 'sonner'
import { createInternalGrade } from '@/lib/actions/instructor'

interface CreateGradeDialogProps {
  userId: string
  enrollmentId: string
  courseCode: string
}

export function CreateGradeDialog({ userId, enrollmentId, courseCode }: CreateGradeDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { markDirty, markClean } = useFormDirty()

  // Form State
  const [assessmentName, setAssessmentName] = useState('')
  const [assessmentType, setAssessmentType] = useState('ASSIGNMENT')
  const [assessmentDate, setAssessmentDate] = useState(new Date().toISOString().split('T')[0])
  const [score, setScore] = useState('')
  const [maxScore, setMaxScore] = useState('100')
  const [comments, setComments] = useState('')

  // EASA specific
  const [mcqScore, setMcqScore] = useState('')
  const [essay1Score, setEssay1Score] = useState('')
  const [essay2Score, setEssay2Score] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const scoreNum = parseFloat(score)
    const maxScoreNum = parseFloat(maxScore)

    if (isNaN(scoreNum) || isNaN(maxScoreNum) || maxScoreNum === 0) {
      toast.error('Please enter valid numeric scores')
      return
    }

    if (!assessmentName.trim()) {
      toast.error('Assessment Name is required')
      return
    }

    setIsSubmitting(true)
    try {
      await createInternalGrade({
        userId,
        enrollmentId,
        assessmentName,
        assessmentType,
        assessmentDate: new Date(assessmentDate),
        score: scoreNum,
        maxScore: maxScoreNum,
        comments,
        mcqScore: mcqScore ? parseFloat(mcqScore) : undefined,
        essay1Score: essay1Score ? parseFloat(essay1Score) : undefined,
        essay2Score: essay2Score ? parseFloat(essay2Score) : undefined,
      })

      toast.success('Grade recorded successfully')
      markClean()
      setOpen(false)
      // Reset form
      setAssessmentName('')
      setScore('')
      setComments('')
      setMcqScore('')
      setEssay1Score('')
      setEssay2Score('')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to record grade')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-aerojet-sky/20 bg-aerojet-sky/5 text-aerojet-sky hover:bg-aerojet-sky/10 dark:border-aerojet-sky/30 dark:bg-aerojet-sky/10 dark:hover:bg-aerojet-sky/20 h-8 gap-2 border-[1.5px] text-xs font-bold"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          Add Internal Grade
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-3xl border border-slate-100 p-0 sm:rounded-[2rem] dark:border-slate-800 dark:bg-slate-950">
        <div className="bg-slate-50 p-6 pb-8 dark:bg-slate-900/50">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-aerojet-blue text-xl font-black dark:text-white">
              Record Grade for {courseCode}
            </DialogTitle>
            <DialogDescription className="font-medium text-slate-500">
              Create a new internal grade entry for this student.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-3">
                <Label
                  htmlFor="assessmentType"
                  className="text-aerojet-sky text-[10px] font-black tracking-widest uppercase"
                >
                  Assessment Type
                </Label>
                <Select
                  value={assessmentType}
                  onValueChange={(v) => {
                    setAssessmentType(v)
                    markDirty()
                  }}
                >
                  <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white font-bold dark:border-slate-800 dark:bg-slate-900">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl font-medium">
                    <SelectItem value="EXAM">Exam</SelectItem>
                    <SelectItem value="ASSIGNMENT">Assignment</SelectItem>
                    <SelectItem value="QUIZ">Quiz</SelectItem>
                    <SelectItem value="PROJECT">Project</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label
                  htmlFor="assessmentDate"
                  className="text-aerojet-sky text-[10px] font-black tracking-widest uppercase"
                >
                  Assessment Date
                </Label>
                <Input
                  id="assessmentDate"
                  type="date"
                  value={assessmentDate}
                  onChange={(e) => {
                    setAssessmentDate(e.target.value)
                    markDirty()
                  }}
                  className="h-12 rounded-xl border-slate-200 bg-white font-bold dark:border-slate-800 dark:bg-slate-900"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label
                htmlFor="assessmentName"
                className="text-aerojet-sky text-[10px] font-black tracking-widest uppercase"
              >
                Assessment Name
              </Label>
              <Input
                id="assessmentName"
                placeholder="e.g. Midterm Practical, Module 2 Essay"
                value={assessmentName}
                onChange={(e) => {
                  setAssessmentName(e.target.value)
                  markDirty()
                }}
                className="h-12 rounded-xl border-slate-200 bg-white font-bold dark:border-slate-800 dark:bg-slate-900"
                required
              />
            </div>

            {/* Total Scores */}
            <div className="grid grid-cols-2 gap-6 rounded-2xl border border-blue-50 bg-blue-50/50 p-4 dark:border-blue-900/30 dark:bg-blue-950/20">
              <div className="space-y-3">
                <Label
                  htmlFor="score"
                  className="text-aerojet-sky text-[10px] font-black tracking-widest uppercase"
                >
                  Total Score
                </Label>
                <Input
                  id="score"
                  type="number"
                  placeholder="Obtained"
                  value={score}
                  onChange={(e) => {
                    setScore(e.target.value)
                    markDirty()
                  }}
                  className="h-12 rounded-xl border-slate-200 bg-white font-black dark:border-slate-800 dark:bg-slate-900"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-3">
                <Label
                  htmlFor="maxScore"
                  className="text-aerojet-sky text-[10px] font-black tracking-widest uppercase"
                >
                  Max Score
                </Label>
                <Input
                  id="maxScore"
                  type="number"
                  placeholder="Total Possible"
                  value={maxScore}
                  onChange={(e) => {
                    setMaxScore(e.target.value)
                    markDirty()
                  }}
                  className="h-12 rounded-xl border-slate-200 bg-white font-black dark:border-slate-800 dark:bg-slate-900"
                  required
                  min="1"
                  step="0.01"
                />
              </div>
            </div>

            {/* Sub-scores Grid (Optional) */}
            <div className="space-y-4 pt-2">
              <Label className="text-[10px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-300">
                Granular Scores (Optional)
              </Label>
              <div className="grid grid-cols-3 gap-4">
                <Input
                  type="number"
                  placeholder="MCQ %"
                  value={mcqScore}
                  onChange={(e) => {
                    setMcqScore(e.target.value)
                    markDirty()
                  }}
                  className="h-12 rounded-xl border-slate-100 bg-white font-black dark:border-slate-800 dark:bg-slate-900"
                  min="0"
                  max="100"
                />
                <Input
                  type="number"
                  placeholder="Essay 1 %"
                  value={essay1Score}
                  onChange={(e) => {
                    setEssay1Score(e.target.value)
                    markDirty()
                  }}
                  className="h-12 rounded-xl border-slate-100 bg-white font-black dark:border-slate-800 dark:bg-slate-900"
                  min="0"
                  max="100"
                />
                <Input
                  type="number"
                  placeholder="Essay 2 %"
                  value={essay2Score}
                  onChange={(e) => {
                    setEssay2Score(e.target.value)
                    markDirty()
                  }}
                  className="h-12 rounded-xl border-slate-100 bg-white font-black dark:border-slate-800 dark:bg-slate-900"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Label
                htmlFor="comments"
                className="text-aerojet-sky text-[10px] font-black tracking-widest uppercase"
              >
                Feedback Comments (Optional)
              </Label>
              <Textarea
                id="comments"
                value={comments}
                onChange={(e) => {
                  setComments(e.target.value)
                  markDirty()
                }}
                placeholder="Add private instructor notes or student feedback..."
                className="min-h-[100px] resize-none rounded-xl border-slate-200 bg-white p-4 font-medium dark:border-slate-800 dark:bg-slate-900"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="h-12 rounded-xl border-slate-200 font-bold dark:border-slate-800"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="from-aerojet-sky to-aerojet-blue h-12 rounded-xl bg-gradient-to-r px-8 font-black text-white hover:from-[#3a8bdf] hover:to-[#001f44]"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Grade'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
