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
import { triggerAutoEnrollmentIfRequired } from '@/lib/enrollment/engine'
import { resolveEnrollmentType, mapProgrammeChoiceToPathwayCode } from '@/lib/enrollment/pathway'
import { ProgrammeChoice } from '@prisma/client'

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
  const verifyTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours (resilient to connection issues)
  const academyEmail = await generateAcademyEmail(
    profile.firstName,
    profile.middleName || undefined,
    profile.lastName
  )
  const { generateStudentId } = await import('@/lib/auth/helpers')
  const studentId = generateStudentId()

  // Activate and promote the applicant
  let createdStudentProfileId: string | null = null

  await prisma.$transaction(async (tx) => {
    // 1. Update User to STUDENT role and ACTIVE status
    await tx.user.update({
      where: { id },
      data: {
        role: 'STUDENT',
        status: 'ACTIVE',
        personalEmail: user.email,
        email: academyEmail,
        academyEmail,
        password: hashedTempPassword,
        verifyToken,
        verifyTokenExpires,
        mustChangePassword: true,
        paymentApprovedAt: new Date(),
        paymentApprovedBy: actorId,
        registrationPaid: true,
      },
    })

    // 2. Map ProgrammeChoice to relational Pathway Code
    const pathwayCode = mapProgrammeChoiceToPathwayCode(user.programmeChoice)
    const enrollmentType = user.programmeChoice
      ? resolveEnrollmentType(user.programmeChoice as ProgrammeChoice)
      : 'MODULAR'

    // Fetch the relational pathway
    const pathway = await tx.studyPathwayModel.findUnique({ where: { code: pathwayCode } })

    const studentProfile = await tx.studentProfile.create({
      data: {
        userId: id,
        studentId,
        enrollmentType,
        pathwayId: pathway?.id ?? null,
        enrollmentStatus: 'ENROLLED',
      },
    })

    createdStudentProfileId = studentProfile.id

    // 3. Approve the associated registration payment
    const regPayment = await tx.payment.findFirst({
      where: { userId: id, referenceType: 'REGISTRATION', status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    })

    if (regPayment) {
      await tx.payment.update({
        where: { id: regPayment.id },
        data: { status: 'APPROVED', approvedAt: new Date(), approvedBy: actorId },
      })
    }
  })

  // 4. Post-transaction: trigger auto-enrollment for FT/Military pathways
  if (createdStudentProfileId) {
    await triggerAutoEnrollmentIfRequired(createdStudentProfileId)
  }

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
