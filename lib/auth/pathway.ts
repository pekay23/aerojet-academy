import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma/client'
import { getAuthSession } from '@/lib/auth/helpers'

export async function requirePathway() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    select: { studyPathway: true },
  })

  if (!profile?.studyPathway) {
    redirect('/applicant/pathway')
  }

  return { session, profile }
}
