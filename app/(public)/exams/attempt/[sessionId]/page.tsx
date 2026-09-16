import { Suspense } from 'react'
import SecureExamClient from '@/components/exam/SecureExamClient'

export default function ExamAttemptPage({ params }: { params: { sessionId: string } }) {
  return (
    <Suspense fallback={<ExamLoading />}>
      <SecureExamClient sessionId={params.sessionId} />
    </Suspense>
  )
}

function ExamLoading() {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-black">
      <div className="text-center">
        <div className="border-aerojet-blue mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Loading secure exam environment...
        </p>
      </div>
    </div>
  )
}
