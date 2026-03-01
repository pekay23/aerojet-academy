import { Metadata } from 'next'
import ReconciliationQueue from '@/app/staff/_components/ReconciliationQueue'

export const metadata: Metadata = {
  title: 'Finance Reconciliation | Staff Portal',
  description: 'Manage and reconcile approved payments against bank settlements.',
}

export default function ReconciliationPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ReconciliationQueue />
    </div>
  )
}
