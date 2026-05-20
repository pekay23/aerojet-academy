import { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { getAuthSession } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import AdvancementForm from './_components/AdvancementForm'

export const metadata: Metadata = { title: 'Year/Semester Advancement | Staff Portal' }
export const dynamic = 'force-dynamic'

export default async function AdvancementPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)

  const [pathways, academicYears] = await Promise.all([
    prismaUnfiltered.studyPathwayModel.findMany({
      select: { id: true, code: true, name: true },
      orderBy: { code: 'asc' },
    }),
    prismaUnfiltered.academicYear.findMany({
      select: { id: true, name: true },
      orderBy: { startDate: 'desc' },
      take: 20,
    }),
  ])

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-aerojet-blue dark:text-white">
          Year / Semester Advancement
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Move a cohort to the next term. This is an EASA Part-147 facility — there is no GPA;
          advancement is term-based. Students can be held back individually. Every outcome is
          logged.
        </p>
      </div>
      <AdvancementForm pathways={pathways} academicYears={academicYears} isAdmin={isAdmin} />
    </div>
  )
}
