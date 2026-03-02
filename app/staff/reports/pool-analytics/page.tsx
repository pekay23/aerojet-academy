import { redirect } from 'next/navigation'

export default function PoolAnalyticsPage() {
  redirect('/staff/reports?tab=pools')
}
