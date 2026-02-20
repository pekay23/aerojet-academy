import { Metadata } from 'next'
import { getGradingQueue } from '@/lib/actions/instructor'
import GradingQueueView from '../_components/GradingQueueView'

export const metadata: Metadata = {
  title: 'Pending Grading | Instructor Portal',
}

export default async function PendingGradingPage() {
  const queue = await getGradingQueue()

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
          Grading Queue
        </h1>
        <p className="mt-2 text-lg font-medium text-slate-500 dark:text-slate-400">
          Review and submit results for student assessments.
        </p>
      </div>

      <GradingQueueView initialQueue={queue} />
    </div>
  )
}
