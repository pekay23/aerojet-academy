import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma/client'
import { Metadata } from 'next'
import CoursesClient from './_components/CoursesClient'

export const metadata: Metadata = { title: 'Courses | Staff Portal' }

export default async function CoursesPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const categories = await prisma.courseCategory.findMany({
    include: {
      courses: {
        orderBy: { code: 'asc' },
      },
      _count: { select: { courses: true } },
    },
    orderBy: { name: 'asc' },
  })

  // Serialise Decimal fields
  const serialized = categories.map((cat) => ({
    ...cat,
    courses: cat.courses.map((c) => ({
      ...c,
      price: c.price.toString(),
    })),
  }))

  return <CoursesClient categories={serialized} />
}
