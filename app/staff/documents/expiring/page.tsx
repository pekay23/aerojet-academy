import { Metadata } from 'next'
import { requireStaff } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { serializePrisma } from '@/lib/utils/serialization'
import ExpiringDocumentsClient from './_components/ExpiringDocumentsClient'

export const metadata: Metadata = { title: 'Expiring Documents | Staff Portal' }
export const dynamic = 'force-dynamic'

export default async function ExpiringDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ window?: string }>
}) {
  await requireStaff()
  const params = await searchParams
  const windowDays = Math.min(Math.max(Number(params.window) || 90, 1), 365)

  const now = new Date()
  const future = new Date(now.getTime() + windowDays * 24 * 60 * 60 * 1000)

  const [documents, licenses] = await Promise.all([
    prismaUnfiltered.studentDocument.findMany({
      where: {
        expiresAt: { not: null, lte: future },
        status: { not: 'ARCHIVED' },
      },
      orderBy: { expiresAt: 'asc' },
      take: 200,
      include: {
        user: {
          select: {
            email: true,
            profile: { select: { firstName: true, lastName: true } },
            studentProfile: { select: { studentId: true } },
          },
        },
      },
    }),
    prismaUnfiltered.studentLicenseTarget.findMany({
      where: {
        expiresAt: { not: null, lte: future },
      },
      orderBy: { expiresAt: 'asc' },
      take: 200,
      select: {
        id: true,
        validFrom: true,
        expiresAt: true,
        ratingClass: true,
        validityPeriodMonths: true,
        studentProfile: {
          select: {
            studentId: true,
            user: {
              select: {
                email: true,
                profile: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
        licenseCategory: { select: { code: true, name: true } },
      },
    }),
  ])

  return (
    <div className="mx-auto w-full max-w-350 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-aerojet-blue text-2xl font-black tracking-tight dark:text-white">
          Expiring Documents & Licenses
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Certificates, licenses, and documents expiring within the selected window.
        </p>
      </div>
      <ExpiringDocumentsClient
        documents={serializePrisma(documents)}
        licenses={serializePrisma(licenses)}
        windowDays={windowDays}
      />
    </div>
  )
}
