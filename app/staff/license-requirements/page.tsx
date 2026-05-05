import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { Metadata } from 'next'
import { serializePrisma } from '@/lib/utils/serialization'
import LicenseRequirementsClient from './_components/LicenseRequirementsClient'

export const metadata: Metadata = { title: 'License Module Requirements | Staff Portal' }

export default async function LicenseRequirementsPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const licenseCategories = await prismaUnfiltered.licenseCategory.findMany({
    include: {
      requirements: {
        include: { course: { select: { id: true, code: true, name: true } } },
      },
    },
    orderBy: { code: 'asc' },
  })

  // Fetch courses with proper sorting
  const courses = await prismaUnfiltered.course.findMany({
    where: { isActive: true },
    select: { id: true, code: true, name: true },
    orderBy: { code: 'asc' },
  })

  // Default sorting configuration
  const defaultSortBy = 'code' // Options: 'code', 'name', or licenseCategory ID
  const defaultSortOrder = 'asc' // Options: 'asc', 'desc'

  return (
    <LicenseRequirementsClient
      licenseCategories={serializePrisma(licenseCategories)}
      courses={serializePrisma(courses)}
      defaultSortBy={defaultSortBy}
      defaultSortOrder={defaultSortOrder}
    />
  )
}
