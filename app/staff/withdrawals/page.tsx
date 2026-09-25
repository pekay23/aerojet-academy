import { Metadata } from 'next'

import { requireStaff } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { serializePrisma } from '@/lib/utils/serialization'
import WithdrawalsManager from './_components/WithdrawalsManager'

export const metadata: Metadata = { title: 'Withdrawals | Staff Portal' }
export const dynamic = 'force-dynamic'

export default async function StaffWithdrawalsPage() {
  const staff = await requireStaff()

  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(staff.role)

  const [requests, students] = await Promise.all([
    prismaUnfiltered.withdrawalRequest.findMany({
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
    }),
    prismaUnfiltered.user.findMany({
      where: {
        role: 'STUDENT',
        status: { notIn: ['ARCHIVED', 'DELETED'] },
      },
      select: {
        id: true,
        email: true,
        profile: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
  ])

  const serializedStudents = serializePrisma(
    students.map((s) => ({
      id: s.id,
      email: s.email,
      profile: s.profile,
    }))
  )

  return (
    <div className="mx-auto w-full max-w-350 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-aerojet-blue text-2xl font-black tracking-tight dark:text-white">
          Student Withdrawals
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Staff confirm requests; an administrator gives final approval. Approval archives the
          student and marks enrolments withdrawn (finance is handled via refunds separately).
        </p>
      </div>
      <WithdrawalsManager
        requests={serializePrisma(requests)}
        students={serializedStudents}
        isAdmin={isAdmin}
      />
    </div>
  )
}
