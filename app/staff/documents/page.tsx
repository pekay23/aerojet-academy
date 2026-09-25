import { redirectToLogin } from '@/lib/auth/redirect-to-login'
import { Metadata } from 'next'
import { getAuthSession } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { serializePrisma } from '@/lib/utils/serialization'
import DocumentsManager from './_components/DocumentsManager'

export const metadata: Metadata = { title: 'Document Vault | Staff Portal' }
export const dynamic = 'force-dynamic'

export default async function StaffDocumentsPage() {
  const session = await getAuthSession()
  if (!session) return await redirectToLogin()

  const documents = await prismaUnfiltered.studentDocument.findMany({
    orderBy: { createdAt: 'desc' },
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
  })

  return (
    <div className="mx-auto w-full max-w-350 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-aerojet-blue text-2xl font-black tracking-tight dark:text-white">
          Document Vault
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Centralized student documents with versioning and expiry. Files may be hosted on
          UploadThing or, as a fallback, Supabase storage buckets.
        </p>
      </div>
      <DocumentsManager documents={serializePrisma(documents)} />
    </div>
  )
}
