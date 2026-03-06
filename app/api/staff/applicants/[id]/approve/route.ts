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

/**
 * POST /api/staff/applicants/[id]/approve
 *
 * Approves the registration fee for an applicant.
 * This does NOT promote to STUDENT — that happens when tuition payment is approved.
 *
 * What this does:
 *  - Sets status PENDING → ACTIVE (keeps role as APPLICANT)
 *  - Marks registrationPaid = true
 *  - Generates academy email + temporary password
 *  - Creates a wallet (needed for modular/exam-only paths)
 *  - Approves the REGISTRATION payment record
 *  - Sends activation email with credentials
 */
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
  if (user.role !== 'APPLICANT') {
    return NextResponse.json({ error: 'User is not an applicant' }, { status: 400 })
  }
  if (user.status !== 'PENDING') {
    return NextResponse.json({ error: 'User is not in PENDING status' }, { status: 400 })
  }

  const profile = user.profile
  if (!profile) return NextResponse.json({ error: 'User profile not found' }, { status: 404 })

  // Generate credentials
  const tempPassword = generateTempPassword()
  const hashedTempPassword = await hashPassword(tempPassword)
  const verifyToken = generateToken()
  const verifyTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const academyEmail = await generateAcademyEmail(
    profile.firstName,
    profile.middleName || undefined,
    profile.lastName
  )

  await prisma.$transaction(async (tx) => {
    // 1. Update User: ACTIVE status, keep APPLICANT role
    await tx.user.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        // Role stays APPLICANT — promotion happens on tuition payment
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

    // 2. Approve the associated registration payment
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

    // 3. Create Wallet early (needed for modular/exam-only paths)
    const existingWallet = await tx.wallet.findUnique({ where: { userId: id } })
    if (!existingWallet) {
      await tx.wallet.create({
        data: {
          userId: id,
          balance: 0,
          reservedBalance: 0,
          availableBalance: 0,
        },
      })
    }

    // NO StudentProfile creation
    // NO role change to STUDENT
    // NO auto-enrollment trigger

    await tx.notification.create({
      data: {
        userId: id,
        title: 'Registration Approved',
        message:
          'Your registration fee has been approved. Welcome to AeroJet Academy! Please check your email for login credentials.',
        type: 'SUCCESS',
        linkUrl: '/applicant',
        linkText: 'Go to Dashboard',
      },
    })
  })

  // Send activation email with credentials
  await sendActivationEmail(
    user.email,
    profile.firstName,
    academyEmail,
    tempPassword,
    verifyToken
  ).catch(console.error)

  await createAuditLog({
    action: 'REGISTRATION_FEE_APPROVED',
    entity: 'users',
    entityId: id,
    userId: actorId,
    description: `Registration fee approved for ${user.email}. Credentials sent. Role remains APPLICANT until tuition payment.`,
  })

  return NextResponse.json({ success: true })
}
