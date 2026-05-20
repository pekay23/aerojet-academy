import { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { getAuthSession } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { serializePrisma } from '@/lib/utils/serialization'
import Part145Manager from './_components/Part145Manager'

export const metadata: Metadata = { title: 'Part-145 Transition | Staff Portal' }
export const dynamic = 'force-dynamic'

export default async function Part145Page() {
  const session = await getAuthSession()
  if (!session) redirect('/login')
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)

  const [organisations, transfers] = await Promise.all([
    prismaUnfiltered.partner145Organisation.findMany({ orderBy: { name: 'asc' } }),
    prismaUnfiltered.maintenance145Transfer.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        user: {
          select: {
            email: true,
            profile: { select: { firstName: true, lastName: true } },
            studentProfile: { select: { studentId: true } },
          },
        },
        organisation: { select: { name: true } },
      },
    }),
  ])

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-aerojet-blue dark:text-white">
          Part-145 Data Transition
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          This academy is an EASA Part-147 training organisation linked to a Part-145 maintenance
          organisation. Package and hand off a student's training record to a linked Part-145.
        </p>
      </div>
      <Part145Manager
        organisations={serializePrisma(organisations)}
        transfers={serializePrisma(transfers)}
        isAdmin={isAdmin}
      />
    </div>
  )
}
