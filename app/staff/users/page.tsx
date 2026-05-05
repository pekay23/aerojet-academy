import { getCachedSession } from '@/lib/auth/session-context'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import PeopleTabs from '../_components/PeopleTabs'

export const metadata: Metadata = { title: 'People | Staff Portal' }

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const session = await getCachedSession()
  if (!session) redirect('/login')

  return <PeopleTabs initialTab={tab} />
}
