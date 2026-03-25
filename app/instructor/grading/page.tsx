import { Metadata } from 'next'
import { getGradingQueue, getGradingHistory } from '@/lib/actions/instructor'
import GradingQueueView from './_components/GradingQueueView'
import GradingHistoryView from './_components/GradingHistoryView'
import GradingTabs from '../_components/GradingTabs'

export const metadata: Metadata = { title: 'Grading | Instructor Portal' }
export const dynamic = 'force-dynamic'

async function PendingTab() {
  const queue = await getGradingQueue()
  return <GradingQueueView initialQueue={queue as any} />
}

async function HistoryTab() {
  const history = await getGradingHistory()
  return <GradingHistoryView initialHistory={history as any} />
}

export default async function GradingPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab = 'pending' } = await searchParams

  return (
    <div className="mx-auto max-w-6xl pb-10">
      <GradingTabs>
        {tab === 'history' ? <HistoryTab /> : <PendingTab />}
      </GradingTabs>
    </div>
  )
}
