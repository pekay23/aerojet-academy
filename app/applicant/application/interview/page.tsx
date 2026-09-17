import { Metadata } from 'next'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import SlotBooking from './_components/SlotBooking'

export const metadata: Metadata = { title: 'Interview Booking' }
export const dynamic = 'force-dynamic'

export default async function InterviewPage() {
  const session = await getAuthSession()
  if (!session?.user) redirect('/login')

  const application = await prismaUnfiltered.application.findUnique({
    where: { userId: session.user.id },
    include: { interviewSlot: true }
  })

  if (!application) redirect('/applicant/dashboard')
  
  // Must be in pending or scheduled to book
  if (application.stage !== 'INTERVIEW_PENDING' && application.stage !== 'INTERVIEW_SCHEDULED') {
    redirect('/applicant/application/status')
  }

  const currentSlot = application.interviewSlot ? {
    id: application.interviewSlot.id,
    date: application.interviewSlot.date.toISOString(),
    startTime: application.interviewSlot.startTime.toISOString(),
    endTime: application.interviewSlot.endTime.toISOString(),
    location: application.interviewSlot.location,
  } : null

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-aerojet-blue dark:text-white">
          Interview Booking
        </h1>
        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
          Congratulations on being shortlisted! Please select an available interview slot that works for you. 
          The interview will be conducted by our admissions panel to assess your readiness for the programme.
        </p>
      </div>

      <SlotBooking currentSlot={currentSlot} />
    </div>
  )
}
