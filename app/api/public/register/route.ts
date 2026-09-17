import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import {
  hashPassword as _hashPassword, generateRegistrationCode, generateToken, checkRateLimit, getClientIp, } from '@/lib/auth/helpers'
import { registerSchema, validateBody } from '@/lib/validation/schemas'
import { apiCreated, apiError, apiTooManyRequests, withErrorHandler } from '@/lib/api/response'
import { sendEmailVerificationEmail } from '@/lib/email/service'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { getRegistrationConfig } from '@/lib/settings'
import { isPipelineEnabled, transitionApplication } from '@/lib/admissions/state-machine'
import { ApplicationStage } from '@prisma/client'
import { trackRegistration, trackReferralClick } from '@/lib/analytics/events'

export const POST = withErrorHandler(async (req: NextRequest) => {
  const config = await getRegistrationConfig()
  // Rate limit: 10 registration attempts per IP per hour (allowing for early validation errors)
  const ip = getClientIp(req)
  if (!checkRateLimit(`register:${ip}`, 10, 60 * 60 * 1000)) {
    return apiTooManyRequests('Too many registration attempts. Please try again later.')
  }

  const body = await req.json()
  const validation = validateBody(registerSchema, body)

  if (!validation.success) {
    return apiError(validation.error)
  }

  const {
    firstName,
    lastName,
    middleName,
    email,
    phone,
    phoneCountryCode,
    nationality,
    dateOfBirth,
    selectedProgramme,
    licenseCategories,
    referralCode,
  } = validation.data
  const normalizedEmail = email.trim().toLowerCase()

  // Check if email already exists (case-insensitive check on both primary and personal emails)
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { equals: normalizedEmail, mode: 'insensitive' } },
        { personalEmail: { equals: normalizedEmail, mode: 'insensitive' } },
      ],
    },
  })
  if (existing) {
    return apiError('An account with this email already exists', 409)
  }

  // Generate credentials
  const registrationCode = generateRegistrationCode()

  // Generate email verification token
  const verifyToken = generateToken()
  const verifyTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  // Check pipeline feature flag
  const pipelineEnabled = await isPipelineEnabled()

  // Create user + profile (+ Application if pipeline enabled) in transaction
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: normalizedEmail,
        personalEmail: normalizedEmail,
        registrationCode,
        registrationFee: config.fee,
        registrationCurrency: config.currency,
        programmeChoice: selectedProgramme,
        selectedLicenseCategories: licenseCategories || [],
        verifyToken,
        verifyTokenExpires,
      },
    })

    const fullPhone = `${phoneCountryCode}${phone.replace(/\s+/g, '')}`

    await tx.profile.create({
      data: {
        userId: newUser.id,
        firstName,
        lastName,
        middleName: middleName || null,
        phone: fullPhone,
        nationality: nationality || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      },
    })

    // EXAM_ONLY keeps the existing simplified flow and bypasses the admissions pipeline.
    if (pipelineEnabled && selectedProgramme !== 'EXAM_ONLY') {
      await tx.application.create({
        data: {
          userId: newUser.id,
          stage: ApplicationStage.REGISTERED,
          programmeChoice: selectedProgramme,
        },
      })
    }

    return newUser
  })

  // Auto-transition REGISTERED → PAYMENT_PENDING (non-blocking)
  if (pipelineEnabled && selectedProgramme !== 'EXAM_ONLY') {
    const application = await prisma.application.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    if (application) {
      transitionApplication(application.id, ApplicationStage.PAYMENT_PENDING, user.id, {
        metadata: { trigger: 'registration' },
      }).catch(console.error)
    }
  }

  // Record referral if a referral code was provided (non-blocking)
  if (referralCode) {
    import('@/lib/referral/operations')
      .then(({ recordReferral }) => recordReferral(referralCode, user.id))
      .then(() => trackReferralClick(referralCode, '/register', user.id).catch(() => {}))
      .catch(console.error)
  }

  // Send verification email (wait for it to finish so serverless functions don't kill the request)
  await sendEmailVerificationEmail(normalizedEmail, firstName, verifyToken)

  // Audit log
  await createAuditLog({
    action: AuditAction.CREATE,
    entity: 'User',
    entityId: user.id,
    userId: user.id,
    details: { email: normalizedEmail },
    ipAddress: ip,
  })

  // Analytics tracking (non-blocking)
  trackRegistration(selectedProgramme, user.id).catch(console.error)

  return apiCreated({
    registrationCode,
    message: 'Registration successful. Please check your email for instructions.',
  })
})
