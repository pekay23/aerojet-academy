import { Metadata } from 'next'
import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import IntakeCycleManager from './_components/IntakeCycleManager'

export const metadata: Metadata = { title: 'Intake Cycles | Admissions | Staff Portal' }

export default async function IntakeCyclesPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  return <IntakeCycleManager />
}
