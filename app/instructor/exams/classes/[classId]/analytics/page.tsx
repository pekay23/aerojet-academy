import { requireInstructor } from '@/lib/auth/helpers'
import { getInstructorProfileByUserId } from '@/lib/instructor/profile'
import { prismaUnfiltered } from '@/lib/prisma/client'
import ClassAnalyticsPage from './_components/ClassAnalyticsPage'

interface PageProps {
  params: Promise<{ classId: string }>
}

export default async function InstructorClassAnalyticsPage({ params }: PageProps) {
  const user = await requireInstructor()
  const instructorProfile = await getInstructorProfileByUserId(user.id)
  if (!instructorProfile) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-red-600">Instructor profile not found.</p>
      </div>
    )
  }

  const { classId } = await params

  const cls = await prismaUnfiltered.class.findFirst({
    where: { id: classId, instructorId: instructorProfile.id },
    include: {
      course: { select: { code: true, name: true } },
    },
  })

  if (!cls) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-red-600">Class not found or you do not have access.</p>
      </div>
    )
  }

  return (
    <ClassAnalyticsPage
      classId={classId}
      className={cls.name}
      courseCode={cls.course.code}
    />
  )
}
