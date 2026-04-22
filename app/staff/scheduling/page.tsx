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

  // Fetch all full-time pathways (auto-populated as tabs)
  const pathways = await prisma.studyPathwayModel.findMany({
    where: {
      code: { in: ['FULL_TIME_4Y', 'FULL_TIME_2Y', 'MILITARY_1Y'] },
    },
    include: {
      academicTerms: {
        include: {
          courseAssignments: true,
          licenseCategory: true,
        },
        orderBy: [{ yearNumber: 'asc' }, { semesterNumber: 'asc' }],
      },
    },
    orderBy: { name: 'asc' },
  })

  // Fetch all full-time programmes (for auto-tab matching)
  const programmesRaw = await prisma.fullTimeProgramme.findMany({
    where: { isActive: true },
    include: {
      programmeYears: { orderBy: { yearNumber: 'asc' } },
    },
    orderBy: { name: 'asc' },
  })
  
  const programmes = programmesRaw.map(p => ({
    ...p,
    totalFee: p.totalFee ? Number(p.totalFee) : null,
    programmeYears: p.programmeYears.map(py => ({
      ...py,
      yearFeeAmount: py.yearFeeAmount ? Number(py.yearFeeAmount) : null,
      seatConfirmationFee: py.seatConfirmationFee ? Number(py.seatConfirmationFee) : null,
      firstPaymentAmount: py.firstPaymentAmount ? Number(py.firstPaymentAmount) : null,
    }))
  }))

  // Fetch all license categories
  const licenseCategories = await prisma.licenseCategory.findMany({
    include: {
      requirements: { include: { course: { select: { id: true, code: true } } } },
    },
    orderBy: { code: 'asc' },
  })

  // Fetch all available EASA Modules
  const courses = await prisma.course
    .findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: { code: 'asc' },
    })
    .then((data) =>
      data.map((course) => ({
        ...course,
        price: Number(course.price),
        duration: course.duration ?? 0,
      }))
    )

  return (
    <div className="px-4 py-8 md:px-8">
      <SchedulingClient
        pathways={pathways}
        programmes={programmes}
        licenseCategories={licenseCategories}
        courses={courses}
      />
    </div>
  )
}
