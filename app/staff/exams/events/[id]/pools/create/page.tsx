import { getAuthSession } from '@/lib/auth/helpers'
import { redirect, notFound } from 'next/navigation'
import prisma from '@/lib/prisma/client'
import { Metadata } from 'next'
import CreateExamPoolForm from './_components/CreateExamPoolForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const event = await prisma.examEvent.findUnique({ where: { id } })
  return { title: `Create Booking | ${event?.name || 'Event'} | Staff Portal` }
}

export default async function CreateExamPoolPage({ params }: PageProps) {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const { id } = await params
  const event = await prisma.examEvent.findUnique({
    where: { id },
  })

  if (!event) notFound()

  // Serialize Decimals for client component
  const serializedEvent = {
    ...event,
    minRevenueTarget: Number(event.minRevenueTarget),
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-aerojet-blue dark:text-white">Create Exam Booking</h1>
        <p className="text-slate-500 dark:text-slate-400">Add a new seating booking to {event.name}</p>
      </div>

      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="p-6">
          <CreateExamPoolForm event={serializedEvent} />
        </div>
      </div>
    </div>
  )
}
