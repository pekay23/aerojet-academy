import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma/client'
import { Metadata } from 'next'
import LicenseRequirementsClient from './_components/LicenseRequirementsClient'

export const metadata: Metadata = { title: 'License Module Requirements | Staff Portal' }

export default async function LicenseRequirementsPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const licenseCategories = await prisma.licenseCategory.findMany({
    include: {
      requirements: {
        include: { course: { select: { id: true, code: true, name: true } } },
      },
    },
    orderBy: { code: 'asc' },
  })

  const courses = await prisma.course.findMany({
    where: { isActive: true },
    select: { id: true, code: true, name: true },
    orderBy: { code: 'asc' },
  })

  return (
    <LicenseRequirementsClient
      licenseCategories={licenseCategories}
      courses={courses}
    />
  )
}
