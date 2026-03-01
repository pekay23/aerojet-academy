import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma/client'
import { getAuthSession } from '@/lib/auth/helpers'
import SchedulingClient from './_components/SchedulingClient'

export const metadata: Metadata = {
  title: 'Academic Scheduling | Staff Portal',
}

export default async function SchedulingPage() {
  const session = await getAuthSession()
  if (!session || !['ADMIN', 'STAFF'].includes(session.user.role)) {
    redirect('/login')
  }

  // Fetch Pathways with their terms and current assignments
  const pathways = await prisma.studyPathwayModel.findMany({
    where: {
      code: { in: ['FULL_TIME_4Y', 'FULL_TIME_2Y', 'MILITARY_1Y'] },
    },
    include: {
      academicTerms: {
        include: { courseAssignments: true },
        orderBy: [{ yearNumber: 'asc' }, { semesterNumber: 'asc' }],
      },
    },
    orderBy: { name: 'asc' },
  })

  // Fetch all available EASA Modules
  const courses = await prisma.course.findMany({
    where: { isActive: true },
    include: { category: true },
    orderBy: { code: 'asc' },
  })

  return (
    <div className="container mx-auto py-8">
      <SchedulingClient pathways={pathways} courses={courses} />
    </div>
  )
}
