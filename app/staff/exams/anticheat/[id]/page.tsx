import { Suspense } from 'react'
import { ExamDetailClient } from './_components/ExamDetailClient'

export default function ExamDetailPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-aerojet-blue border-t-transparent" /></div>}>
      <ExamDetailClient examId={params.id} />
    </Suspense>
  )
}
