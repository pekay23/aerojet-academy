import { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { getAuthSession } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { serializePrisma } from '@/lib/utils/serialization'
import BatchEnrollForm from './_components/BatchEnrollForm'

export const metadata: Metadata = { title: 'Batch Enroll | Staff Portal' }

export default async function BatchEnrollPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'STAFF']
  if (!allowedRoles.includes(session.user.role)) redirect('/login')

  // Fetch all required data
  const [academicYears, courses, students] = await Promise.all([
    prismaUnfiltered.academicYear.findMany({
      where: { isActive: true },
      include: {
        semesters: {
          where: { isActive: true },
          orderBy: { startDate: 'asc' },
        },
      },
      orderBy: { startDate: 'desc' },
    }),
    prismaUnfiltered.course.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    }),
    prismaUnfiltered.user.findMany({
      where: {
        role: 'STUDENT',
        status: 'ACTIVE',
        studentProfile: { enrollmentType: 'FULL_TIME' },
      },
      include: {
        profile: { select: { firstName: true, lastName: true } },
        studentProfile: {
          select: {
            studentId: true,
            enrollmentType: true,
            academicYearId: true,
            semesterId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const serializedStudents = serializePrisma(
    students.map((s) => ({
      id: s.id,
      name: s.profile ? `${s.profile.firstName} ${s.profile.lastName}` : s.email,
      studentId: s.studentProfile?.studentId || 'N/A',
      email: s.email,
      academicYearId: s.studentProfile?.academicYearId || null,
      semesterId: s.studentProfile?.semesterId || null,
    }))
  )

  const serializedCourses = serializePrisma(
    courses.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      category: c.categoryId,
    }))
  )

  const serializedYears = serializePrisma(
    academicYears.map((y) => ({
      id: y.id,
      name: y.name,
      semesters: y.semesters.map((s) => ({
        id: s.id,
        name: s.name,
      })),
    }))
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl lg:text-3xl dark:text-slate-100">
          Batch Course Activation
        </h1>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm dark:text-slate-400">
          Activate courses for full-time students by semester. Select the academic period, students,
          and courses to enroll them in.
        </p>
      </div>

      <BatchEnrollForm
        academicYears={serializedYears}
        courses={serializedCourses}
        students={serializedStudents}
      />
    </div>
  )
}
