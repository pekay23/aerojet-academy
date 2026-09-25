import { redirectToLogin } from '@/lib/auth/redirect-to-login'
import { getAuthSession } from '@/lib/auth/helpers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getPoolWithDetails } from '@/lib/pools/operations'
import { Metadata } from 'next'
import EditExamPoolForm from './_components/EditExamPoolForm'
import { serializePrisma } from '@/lib/utils/serialization'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const pool = await getPoolWithDetails(id)
  return { title: `Edit Pool | ${pool?.name || 'Pool'} | Staff Portal` }
}

export default async function EditExamPoolPage({ params }: PageProps) {
  const session = await getAuthSession()
  if (!session) return await redirectToLogin()

  const { id } = await params
  const pool = await getPoolWithDetails(id)
  if (!pool) notFound()

  // Serialize Decimals for client component
  const serializedPool = serializePrisma(pool)

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href={`/staff/exams/pools/${pool.id}`}
          className="hover:text-aerojet-blue inline-flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Pool: {pool.name}
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-aerojet-blue text-3xl font-black tracking-tight dark:text-white">
          Edit Exam Booking
        </h1>
        <p className="text-slate-500 dark:text-slate-400">Update details for {pool.name}</p>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="p-6">
          <EditExamPoolForm pool={serializedPool} />
        </div>
      </div>
    </div>
  )
}
