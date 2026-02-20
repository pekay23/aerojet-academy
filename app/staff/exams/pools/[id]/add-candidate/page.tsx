import { getAuthSession } from '@/lib/auth/helpers'
import { redirect, notFound } from 'next/navigation'
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
  if (!session) redirect('/login')

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
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-[#002a5c]"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Pool: {pool.name}
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-[#002a5c] dark:text-white">Add Candidate</h1>
        <p className="text-slate-500 dark:text-slate-400">Manually add a student to this exam pool.</p>
      </div>

      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="p-6">
          <AddCandidateForm pool={serializedPool} />
        </div>
      </div>
    </div>
  )
}
