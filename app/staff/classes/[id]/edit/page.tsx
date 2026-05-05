import { getAuthSession, requireStaff } from '@/lib/auth/helpers'
import { redirect, notFound } from 'next/navigation'
import { prismaUnfiltered } from '@/lib/prisma/client'
import EditClassForm from './EditClassForm'
import { Metadata } from 'next'
import { serializePrisma } from '@/lib/utils/serialization'

export const metadata: Metadata = { title: 'Edit Class | Staff Portal' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditClassPage({ params }: Props) {
  await requireStaff()
  const { id } = await params

  function slugify(text: string) {
    return text?.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-') || '';
  }

  // Fallback: If id is a slug, find the class by name
  let targetId = id
  if (id.length < 20) { // CUIDs are usually 25 chars, simple heuristic
    const allBasicClasses = await prismaUnfiltered.class.findMany({ select: { id: true, name: true } })
    const matchedClass = allBasicClasses.find(c => slugify(c.name) === id)
    if (matchedClass) targetId = matchedClass.id
  }

  const [cls, courses, instructors] = await Promise.all([
    prismaUnfiltered.class.findUnique({
      where: { id: targetId },
    }),
    prismaUnfiltered.course.findMany({
      where: { isActive: true },
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
  ])

  if (!cls) notFound()

  // Serialize Prisma objects (Decimal/Date) for Client Component
  const serializedCls = serializePrisma(cls)
  const serializedCourses = serializePrisma(courses)
  const serializedInstructors = serializePrisma(instructors)

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-aerojet-blue dark:text-white">Edit Class</h1>
        <p className="text-slate-500 dark:text-slate-400">Update class details and schedule</p>
      </div>

      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <EditClassForm
          initialData={serializedCls}
          courses={serializedCourses}
          instructors={serializedInstructors}
        />
      </div>
    </div>
  )
}
