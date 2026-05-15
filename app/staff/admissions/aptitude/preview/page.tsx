import { Metadata } from 'next'
import { requireStaff } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import PreviewClient from './_components/PreviewClient'

export const metadata: Metadata = { title: 'Aptitude Test Preview | Staff' }
export const dynamic = 'force-dynamic'

export default async function AptitudePreviewPage() {
  await requireStaff()

  const banks = await prismaUnfiltered.aptitudeTestBank.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-aerojet-blue dark:text-white sm:text-3xl">
          Aptitude Test Preview
        </h1>
        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
          Preview the test exactly as applicants will see it. Answers and explanations are shown for review.
        </p>
      </div>

      <PreviewClient banks={banks} />
    </div>
  )
}
