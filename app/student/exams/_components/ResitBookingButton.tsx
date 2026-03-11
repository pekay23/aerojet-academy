'use client'

import { RefreshCcw } from 'lucide-react'
import ResitBooking from './ResitBooking'

interface ExamEvent {
  id: string
  name: string
  startDate: Date
  endDate: Date
}

interface FailedExam {
  examId: string
  examName: string
  moduleCode: string
  moduleName: string
  score: number
  passingScore: number
  examDate: string
  eventName: string | null
}

interface ResitBookingButtonProps {
  moduleCode: string
  moduleName: string
  score: number
  passingScore: number
  examDate: string
  eventName: string | null
  resitPrice: number
  currency: string
  availableBalance: number
  events: ExamEvent[]
}

export default function ResitBookingButton({
  moduleCode,
  moduleName,
  score,
  passingScore,
  examDate,
  eventName,
  resitPrice,
  currency,
  availableBalance,
  events,
}: ResitBookingButtonProps) {
  const failedExamDetail: FailedExam = {
    examId: `temp-${moduleCode}`, // placeholder as we use moduleCode now
    examName: moduleName,
    moduleCode,
    moduleName,
    score,
    passingScore,
    examDate,
    eventName,
  }

  return (
    <ResitBooking
      failedExams={[failedExamDetail]}
      freeResits={[]} // We don't have bundle info here, will use wallet
      resitPrice={resitPrice}
      currency={currency}
      availableBalance={availableBalance}
      events={events}
      trigger={
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 transition-all hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400">
          <RefreshCcw className="h-3.5 w-3.5" />
          Book Resit
        </button>
      }
    />
  )
}
