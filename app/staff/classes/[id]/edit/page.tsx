import { getAuthSession, requireStaff } from '@/lib/auth/helpers'
import { redirect, notFound } from 'next/navigation'
import prisma from '@/lib/prisma/client'
import EditClassForm from './EditClassForm'
import { Metadata } from 'next'

export const metadata: Metadata = { title: 'Edit Class | Staff Portal' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditClassPage({ params }: Props) {
  await requireStaff()
  const { id } = await params

  const [cls, courses, instructors] = await Promise.all([
    prisma.class.findUnique({
      where: { id },
    }),
    prisma.course.findMany({
      where: { isActive: true },
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

  if (!cls) notFound()

  // Convert Decimal to number for serialization
  const serializedCourses = courses.map((course) => ({
    ...course,
    price: Number(course.price),
  }))

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-aerojet-blue dark:text-white">Edit Class</h1>
        <p className="text-slate-500 dark:text-slate-400">Update class details and schedule</p>
      </div>

      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <EditClassForm
          initialData={cls}
          courses={serializedCourses}
          instructors={instructors}
        />
      </div>
    </div>
  )
}
