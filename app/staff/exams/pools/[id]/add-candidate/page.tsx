import { redirectToLogin } from '@/lib/auth/redirect-to-login'
import { getAuthSession } from '@/lib/auth/helpers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getPoolWithDetails } from '@/lib/pools/operations'
import { Metadata } from 'next'
import AddCandidateForm from './_components/AddCandidateForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const pool = await getPoolWithDetails(id)
  return { title: `Add Candidate | ${pool?.name || 'Pool'} | Staff Portal` }
}

export default async function AddCandidatePage({ params }: PageProps) {
  const session = await getAuthSession()
  if (!session) return await redirectToLogin()

  const { id } = await params
  const pool = await getPoolWithDetails(id)
  if (!pool) notFound()

  // Serialize Decimals
  const serializedPool = {
    ...pool,
    seatPrice: Number(pool.seatPrice),
    event: {
      ...pool.event,
      minRevenueTarget: Number(pool.event.minRevenueTarget),
    },
  }

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
          Add Candidate
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Manually add a student to this exam booking.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="p-6">
          <AddCandidateForm pool={serializedPool} />
        </div>
      </div>
    </div>
  )
}
