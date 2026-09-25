import { redirectToLogin } from '@/lib/auth/redirect-to-login'
import { Metadata } from 'next'
import { getAuthSession } from '@/lib/auth/helpers'
import IntakeCycleManager from './_components/IntakeCycleManager'

export const metadata: Metadata = { title: 'Intake Cycles | Admissions | Staff Portal' }

export default async function IntakeCyclesPage() {
  const session = await getAuthSession()
  if (!session) return await redirectToLogin()

  return <IntakeCycleManager />
}
