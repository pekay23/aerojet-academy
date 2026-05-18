import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { serializePrisma } from '@/lib/utils/serialization'
import SchedulingMatrix from './_components/SchedulingMatrix'

export default async function AcademicSchedulingPage() {
  await requireStaff()

  const [pathways, courses] = await Promise.all([
    prismaUnfiltered.studyPathwayModel.findMany({
      include: {
        academicTerms: {
          orderBy: [{ yearNumber: 'asc' }, { semesterNumber: 'asc' }],
          include: {
            courseAssignments: {
              include: {
                course: {
                  select: { id: true, code: true, name: true },
                },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    }),
    prismaUnfiltered.course.findMany({
      where: { isActive: true },
      select: { id: true, code: true, name: true, isActive: true, duration: true },
      orderBy: { code: 'asc' },
    }),
  ])

  return (
    <SchedulingMatrix
      initialPathways={serializePrisma(pathways)}
      initialCourses={serializePrisma(courses)}
    />
  )
}
