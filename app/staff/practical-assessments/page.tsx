import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { Metadata } from 'next'
import { serializePrisma } from '@/lib/utils/serialization'
import PracticalAssessmentsClient from './_components/PracticalAssessmentsClient'

export const metadata: Metadata = { title: 'Practical Training Assessments | Staff Portal' }

export default async function PracticalAssessmentsPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const [records, courses, students, instructors, ataChapters] = await Promise.all([
    // Initial 50 records
    prismaUnfiltered.practicalTrainingRecord.findMany({
      include: {
        ataChapter: { select: { id: true, code: true, title: true } },
        course: { select: { id: true, name: true, code: true } },
        instructor: { select: { id: true, profile: { select: { firstName: true, lastName: true } } } },
        studentProfile: {
          select: {
            id: true,
            studentId: true,
            user: { select: { profile: { select: { firstName: true, lastName: true } } } },
          },
        },
      },
      orderBy: { date: 'desc' },
      take: 50,
    }),
    // Active courses
    prismaUnfiltered.course.findMany({
      where: { isActive: true },
      select: { id: true, code: true, name: true },
      orderBy: { code: 'asc' },
    }),
    // Active students with profiles
    prismaUnfiltered.studentProfile.findMany({
      select: {
        id: true,
        studentId: true,
        user: {
          select: {
            profile: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
      orderBy: { studentId: 'asc' },
    }),
    // Instructors and staff
    prismaUnfiltered.user.findMany({
      where: {
        role: { in: ['INSTRUCTOR', 'EXAMINER', 'STAFF', 'ADMIN', 'SUPER_ADMIN'] },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        profile: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { profile: { firstName: 'asc' } },
    }),
    // ATA Chapters
    prismaUnfiltered.aTAChapter.findMany({
      where: { isActive: true },
      select: { id: true, code: true, title: true, category: true },
      orderBy: { sortOrder: 'asc' },
    }),
  ])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Practical Training Assessments
          </h1>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
            Log and review technical competency practical tasks (P1/P2) and dual-signature records.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <PracticalAssessmentsClient
          initialRecords={serializePrisma(records)}
          courses={serializePrisma(courses)}
          students={serializePrisma(students)}
          instructors={serializePrisma(instructors)}
          ataChapters={serializePrisma(ataChapters)}
        />
      </div>
    </div>
  )
}
