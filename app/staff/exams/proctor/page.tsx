import { Suspense } from 'react'
import { ProctorDashboardClient } from './_components/ProctorDashboardClient'

export default function ProctorDashboardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-aerojet-blue border-t-transparent" /></div>}>
      <ProctorDashboardClient />
    </Suspense>
  )
}
