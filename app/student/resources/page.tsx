import { getStudentResources } from '@/lib/actions/resources'
import ResourcesView from '@/app/instructor/resources/_components/ResourcesView'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import { canAccessFeature, getEnrollmentMilestoneStatus, getStudentStatus } from '@/lib/access-control'
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
    const [milestoneStatus, wallet] = await Promise.all([
      getEnrollmentMilestoneStatus(session.user.id),
      prisma.wallet.findUnique({
        where: { userId: session.user.id },
        select: { availableBalance: true, reservedBalance: true, currency: true },
      }),
    ])

    const walletBalance = {
      available: Number(wallet?.availableBalance ?? 0),
      held: Number(wallet?.reservedBalance ?? 0),
      currency: wallet?.currency ?? 'EUR',
    }

    return (
      <div className="mx-auto max-w-[1600px] space-y-8">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-aerojet-blue sm:text-3xl dark:text-white">
            Resources
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Access student handbooks, forms, and institutional materials.
          </p>
        </div>

        <PaymentRequiredBanner
          accessLevel="SEAT_ONLY"
          milestoneStatus={milestoneStatus}
          walletBalance={walletBalance}
        />
      </div>
    )
  }

  const resources = await getStudentResources()

  return (
    <div className="mx-auto max-w-[1600px] space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-aerojet-blue sm:text-3xl dark:text-white">
          Resources
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Access student handbooks, forms, and institutional materials.
        </p>
      </div>

      <ResourcesView initialResources={resources} />
    </div>
  )
}
