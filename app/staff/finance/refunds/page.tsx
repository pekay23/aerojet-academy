import { redirectToLogin } from '@/lib/auth/redirect-to-login'
import { Metadata } from 'next'
import { getAuthSession } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { serializePrisma } from '@/lib/utils/serialization'
import RefundsManager from './_components/RefundsManager'

export const metadata: Metadata = { title: 'Refunds | Staff Portal' }
export const dynamic = 'force-dynamic'

export default async function StaffRefundsPage() {
  const session = await getAuthSession()
  if (!session) return await redirectToLogin()

  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)

  const refunds = await prismaUnfiltered.refund.findMany({
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    take: 200,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          profile: { select: { firstName: true, lastName: true } },
          studentProfile: { select: { studentId: true } },
        },
      },
    },
  })

  return (
    <div className="mx-auto w-full max-w-350 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-aerojet-blue text-2xl font-black tracking-tight dark:text-white">
          Refunds
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Staff raise and confirm refunds; an administrator approves, which credits the student's
          wallet. Every refund records a reason and an approval trail.
        </p>
      </div>
      <RefundsManager refunds={serializePrisma(refunds)} isAdmin={isAdmin} />
    </div>
  )
}
