import { redirectToLogin } from '@/lib/auth/redirect-to-login'
import { getAuthSession } from '@/lib/auth/helpers'
import { notFound } from 'next/navigation'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { Metadata } from 'next'
import CreateExamPoolForm from './_components/CreateExamPoolForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const event = await prismaUnfiltered.examEvent.findUnique({ where: { id } })
  return { title: `Create Booking | ${event?.name || 'Event'} | Staff Portal` }
}

export default async function CreateExamPoolPage({ params }: PageProps) {
  const session = await getAuthSession()
  if (!session) return await redirectToLogin()

  const { id } = await params
  const event = await prismaUnfiltered.examEvent.findUnique({
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
        <h1 className="text-aerojet-blue text-3xl font-black tracking-tight dark:text-white">
          Create Exam Booking
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Add a new seating booking to {event.name}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="p-6">
          <CreateExamPoolForm event={serializedEvent} />
        </div>
      </div>
    </div>
  )
}
