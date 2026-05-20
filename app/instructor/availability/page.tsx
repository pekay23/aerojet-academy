import { Metadata } from 'next'

import { requireInstructor } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { serializePrisma } from '@/lib/utils/serialization'
import AvailabilityManager from '@/components/shared/AvailabilityManager'

export const metadata: Metadata = { title: 'My Availability | Instructor Portal' }
export const dynamic = 'force-dynamic'

export default async function InstructorAvailabilityPage() {
  const user = await requireInstructor()
  const slots = await prismaUnfiltered.staffAvailability.findMany({
    where: { userId: user.id },
    orderBy: [{ kind: 'asc' }, { dayOfWeek: 'asc' }, { date: 'asc' }],
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-aerojet-blue dark:text-white">
          My Availability
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Tell staff when you are available to teach. Staff use this when assigning classes.
        </p>
      </div>
      <AvailabilityManager slots={serializePrisma(slots)} />
    </div>
  )
}
