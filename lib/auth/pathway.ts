import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma/client'
import { getAuthSession } from '@/lib/auth/helpers'

export async function requirePathway() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    select: { pathwayId: true, pathwayRel: { select: { code: true, name: true } } },
  })

  if (!profile?.pathwayId) {
    redirect('/applicant/pathway')
  }

  return { session, profile }
}
