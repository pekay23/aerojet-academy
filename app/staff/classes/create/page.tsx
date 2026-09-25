import { redirectToLogin } from '@/lib/auth/redirect-to-login'
import { getAuthSession } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { serializePrisma } from '@/lib/utils/serialization'
import CreateClassForm from './CreateClassForm'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Schedule Class | Staff Portal',
  description: 'Create a new class schedule and assign an instructor.',
}

export default async function CreateClassPage() {
  const session = await getAuthSession()
  if (!session) return await redirectToLogin()

  // Fetch courses, instructors, and classrooms for the form
  const [courses, instructors, classrooms] = await Promise.all([
    prismaUnfiltered.course.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true },
      orderBy: { code: 'asc' },
    }),
    prismaUnfiltered.instructorProfile.findMany({
      select: {
        id: true,
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    }),
    prismaUnfiltered.classroom.findMany({
      select: { id: true, name: true, capacity: true, type: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <div className="mx-auto max-w-450">
      <div className="mb-8">
        <h1 className="text-aerojet-blue text-3xl font-black tracking-tight dark:text-white">
          Schedule Class
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Create a new class instance for a course.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <CreateClassForm
          courses={serializePrisma(courses)}
          instructors={serializePrisma(instructors)}
          classrooms={serializePrisma(classrooms)}
        />
      </div>
    </div>
  )
}
