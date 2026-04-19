import { requireStaff } from '@/lib/auth/helpers'
import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma/client'
import EditCourseForm from './EditCourseForm'
import { Metadata } from 'next'
import { serializePrisma } from '@/lib/utils/serialization'

export const metadata: Metadata = { title: 'Edit Course | Staff Portal' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditCoursePage({ params }: Props) {
  await requireStaff()
  const { id } = await params

  const course = await prisma.course.findFirst({
    where: { OR: [{ id }, { code: id }] },
  })

  if (!course) notFound()

  // Serialize Prisma objects (Decimal/Date) for Client Component
  const serializedCourse = serializePrisma(course)

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-aerojet-blue dark:text-white">Edit Course</h1>
        <p className="text-slate-500 dark:text-slate-400">Update course details and pricing</p>
      </div>

      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <EditCourseForm initialData={serializedCourse} />
      </div>
    </div>
  )
}
