import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma/client'
import CreateClassForm from './CreateClassForm'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Schedule Class | Staff Portal',
  description: 'Create a new class schedule and assign an instructor.',
}

export default async function CreateClassPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  // Fetch courses and instructors for the form
  const [courses, instructors] = await Promise.all([
    prisma.course.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true },
      orderBy: { code: 'asc' },
    }),
    prisma.instructorProfile.findMany({
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
  ])

  return (
    <div className="mx-auto max-w-[1600px]">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-aerojet-blue dark:text-white">Schedule Class</h1>
        <p className="text-slate-500 dark:text-slate-400">Create a new class instance for a course.</p>
      </div>

      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <CreateClassForm courses={courses} instructors={instructors} />
      </div>
    </div>
  )
}
