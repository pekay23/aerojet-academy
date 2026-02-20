import { Metadata } from 'next'
import { getGradingHistory } from '@/lib/actions/instructor'
import GradingHistoryView from '../_components/GradingHistoryView'

export const metadata: Metadata = {
  title: 'Grading History | Instructor Portal',
}

export default async function GradingHistoryPage() {
  const history = await getGradingHistory()

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
          Grading History
        </h1>
        <p className="mt-2 text-lg font-medium text-slate-500 dark:text-slate-400">
          Review and update previously submitted assessment results.
        </p>
      </div>

      <GradingHistoryView initialHistory={history} />
    </div>
  )
}
