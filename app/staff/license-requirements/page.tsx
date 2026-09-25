import { redirectToLogin } from '@/lib/auth/redirect-to-login'
import { getAuthSession } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { Metadata } from 'next'
import { serializePrisma } from '@/lib/utils/serialization'
import LicenseRequirementsClient from './_components/LicenseRequirementsClient'

export const metadata: Metadata = { title: 'License Module Requirements | Staff Portal' }

export default async function LicenseRequirementsPage() {
  const session = await getAuthSession()
  if (!session) return await redirectToLogin()

  const [licenseCategories, courses] = await Promise.all([
    prismaUnfiltered.licenseCategory.findMany({
      include: {
        requirements: {
          include: { course: { select: { id: true, code: true, name: true } } },
        },
      },
      orderBy: { code: 'asc' },
    }),
    prismaUnfiltered.course.findMany({
      where: { isActive: true },
      select: { id: true, code: true, name: true },
      orderBy: { code: 'asc' },
    }),
  ])

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
