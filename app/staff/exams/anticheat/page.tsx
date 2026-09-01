import { Suspense } from 'react'
import { ExamListClient } from './_components/ExamListClient'

export default function AnticheatExamsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-aerojet-blue border-t-transparent" /></div>}>
      <ExamListClient />
    </Suspense>
  )
}
