import { Metadata } from 'next'
import { requireStaff } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import MedicalReviewDashboard from './_components/MedicalReviewDashboard'

export const metadata: Metadata = { title: 'Medical Review | Admissions' }
export const dynamic = 'force-dynamic'

export default async function MedicalPage() {
  await requireStaff()

  const applications = await prismaUnfiltered.application.findMany({
    where: {
      stage: { in: ['MEDICAL_PENDING', 'MEDICAL_SUBMITTED', 'MEDICAL_CLEARED'] },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          profile: { select: { firstName: true, lastName: true, phone: true } },
        },
      },
      documents: {
        where: {
          documentType: { slug: { contains: 'medical' } },
        },
        include: {
          documentType: { select: { name: true } },
          fileUpload: { select: { url: true, fileName: true } },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
          Medical Review
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Review medical examination documents and clear applicants for enrollment.
        </p>
      </div>

      <MedicalReviewDashboard applications={applications as any} />
    </div>
  )
}
