import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { Metadata } from 'next'
import CoursesClient from './_components/CoursesClient'
import { serializePrisma } from '@/lib/utils/serialization'

export const metadata: Metadata = { title: 'Courses | Staff Portal' }

export default async function CoursesPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const categories = await prismaUnfiltered.courseCategory.findMany({
    include: {
      courses: {
        orderBy: { code: 'asc' },
      },
      _count: { select: { courses: true } },
    },
    orderBy: { name: 'asc' },
  })

  // Natural Sort & Serialise Decimal fields
  const serialized = categories.map((cat) => {
    // Sort courses naturally by code (e.g. M1, M2... M9, M10)
    const sortedCourses = [...cat.courses].sort((a, b) =>
      new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }).compare(a.code, b.code)
    )

    return serializePrisma({
      ...cat,
      courses: sortedCourses,
    })
  })

  return <CoursesClient categories={serialized} />
}
