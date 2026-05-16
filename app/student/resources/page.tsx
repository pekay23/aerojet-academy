import { getStudentResources } from '@/lib/actions/resources'
import StudentResourcesView from './_components/StudentResourcesView'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import {
  canAccessFeature,
  getEnrollmentMilestoneStatus,
  getStudentPaymentAccessLevel,
  getStudentStatus,
} from '@/lib/access-control'
import { PaymentRequiredBanner } from '../_components/PaymentRequiredBanner'

export const metadata: Metadata = {
  title: 'Student Resources | Student Portal',
  description: 'Access course materials and learning resources.',
}

export default async function StudentResourcesPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const { isFullTime, isExamOnly, isModular } = await getStudentStatus(session.user.id)
  const hasAccess = await canAccessFeature(session.user.id, 'materials')

  if (isFullTime && !hasAccess) {
    const [milestoneStatus, wallet, accessLevel] = await Promise.all([
      getEnrollmentMilestoneStatus(session.user.id),
      prisma.wallet.findUnique({
        where: { userId: session.user.id },
        select: { availableBalance: true, reservedBalance: true, currency: true },
      }),
      getStudentPaymentAccessLevel(session.user.id),
    ])

    const walletBalance = {
      available: Number(wallet?.availableBalance ?? 0),
      held: Number(wallet?.reservedBalance ?? 0),
      currency: wallet?.currency ?? 'EUR',
    }

    return (
      <div className="mx-auto max-w-[1600px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-aerojet-blue dark:text-white">
            Resources
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Access student handbooks, forms, and institutional materials.
          </p>
        </div>

        <PaymentRequiredBanner
          accessLevel={accessLevel}
          milestoneStatus={milestoneStatus}
          walletBalance={walletBalance}
        />
      </div>
    )
  }

  const resources = await getStudentResources()

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-aerojet-blue dark:text-white">
          Resources
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Access student handbooks, forms, and institutional materials.
        </p>
      </div>

      <StudentResourcesView initialResources={resources} />
    </div>
  )
}
