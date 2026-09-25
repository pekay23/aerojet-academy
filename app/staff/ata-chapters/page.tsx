import { redirectToLogin } from '@/lib/auth/redirect-to-login'
import { getAuthSession } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { Metadata } from 'next'
import { serializePrisma } from '@/lib/utils/serialization'
import ATAChaptersClient from './_components/ATAChaptersClient'

export const metadata: Metadata = { title: 'ATA Chapters | Staff Portal' }

export default async function ATAChaptersPage() {
  const session = await getAuthSession()
  if (!session) return await redirectToLogin()

  const ataChapters = await prismaUnfiltered.aTAChapter.findMany({
    orderBy: { sortOrder: 'asc' },
  })

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-aerojet-blue text-3xl font-black tracking-tight uppercase dark:text-white">
          ATA Chapters
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Manage standard ATA 100 chapters used for Practical Training and OJT logbooks.
        </p>
      </div>

      <ATAChaptersClient initialChapters={serializePrisma(ataChapters)} />
    </div>
  )
}
