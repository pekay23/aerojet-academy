import { getAuthSession } from '@/lib/auth/helpers'
import { redirect, notFound } from 'next/navigation'
import prisma from '@/lib/prisma/client'
import { Metadata } from 'next'
import { serializePrisma } from '@/lib/utils/serialization'
import EditExamEventForm from './_components/EditExamEventForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const event = await prisma.examEvent.findUnique({ where: { id } })
  return { title: `Edit ${event?.name || 'Event'} | Staff Portal` }
}

export default async function EditExamEventPage({ params }: PageProps) {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const { id } = await params
  const event = await prisma.examEvent.findUnique({
    where: { id },
  })

  if (!event) notFound()

  // Serialize Prisma objects (Decimal/Date) for Client Component
  const serializedEvent = serializePrisma(event)

  if (!event) notFound()

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-aerojet-blue dark:text-white">
          Edit Exam Event
        </h1>
        <p className="text-slate-500 dark:text-slate-400">Update details for {event.name}</p>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="p-6">
          <EditExamEventForm event={serializedEvent} />
        </div>
      </div>
    </div>
  )
}
