import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import {
  hashPassword,
  generateToken,
  generateTempPassword,
  generateAcademyEmail,
} from '@/lib/auth/helpers'
import { sendActivationEmail } from '@/lib/email/service'
import { createAuditLog } from '@/lib/audit/logger'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const actorId = (session.user as any).id

  const user = await prisma.user.findUnique({
    where: { id },
    include: { profile: true },
  })

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (user.status !== 'PENDING') {
    return NextResponse.json({ error: 'User is not in PENDING status' }, { status: 400 })
  }

  const profile = user.profile
  if (!profile) return NextResponse.json({ error: 'User profile not found' }, { status: 404 })

  // Generate credentials
  const tempPassword = generateTempPassword()
  const hashedTempPassword = await hashPassword(tempPassword)
  const verifyToken = generateToken()
  const academyEmail = await generateAcademyEmail(
    profile.firstName,
    profile.lastName,
    profile.middleName || undefined
  )

  // Activate the applicant
  await prisma.user.update({
    where: { id },
    data: {
      status: 'ACTIVE',
      academyEmail,
      password: hashedTempPassword,
      verifyToken,
      mustChangePassword: true,
      paymentApprovedAt: new Date(),
      paymentApprovedBy: actorId,
      registrationPaid: true,
    },
  })

  // Send activation email
  await sendActivationEmail(
    user.email,
    profile.firstName,
    academyEmail,
    tempPassword,
    verifyToken
  ).catch(console.error)

  await createAuditLog({
    action: 'APPLICANT_APPROVED',
    entity: 'users',
    entityId: id,
    userId: actorId,
    description: `Applicant approved: ${user.email}. Credentials sent.`,
  })

  return NextResponse.json({ success: true })
}
