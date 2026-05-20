import { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { getAuthSession } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { serializePrisma } from '@/lib/utils/serialization'
import WithdrawalsManager from './_components/WithdrawalsManager'

export const metadata: Metadata = { title: 'Withdrawals | Staff Portal' }
export const dynamic = 'force-dynamic'

export default async function StaffWithdrawalsPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)

  const requests = await prismaUnfiltered.withdrawalRequest.findMany({
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    take: 200,
    include: {
      user: {
        select: {
          email: true,
          profile: { select: { firstName: true, lastName: true } },
          studentProfile: { select: { studentId: true } },
        },
      },
    },
  })

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-aerojet-blue dark:text-white">
          Student Withdrawals
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Staff confirm requests; an administrator gives final approval. Approval archives the
          student and marks enrolments withdrawn (finance is handled via refunds separately).
        </p>
      </div>
      <WithdrawalsManager requests={serializePrisma(requests)} isAdmin={isAdmin} />
    </div>
  )
}
