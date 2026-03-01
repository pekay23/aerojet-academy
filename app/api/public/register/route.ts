import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import {
  hashPassword,
  generateRegistrationCode,
  generateToken,
  checkRateLimit,
  getClientIp,
} from '@/lib/auth/helpers'
import { registerSchema, validateBody } from '@/lib/validation/schemas'
import { apiCreated, apiError, apiTooManyRequests, withErrorHandler } from '@/lib/api/response'
import { sendRegistrationEmail, sendEmailVerificationEmail } from '@/lib/email/service'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { getRegistrationConfig } from '@/lib/settings'

export const POST = withErrorHandler(async (req: NextRequest) => {
  const config = await getRegistrationConfig()
  // Rate limit: 3 registrations per IP per hour
  const ip = getClientIp(req)
  if (!checkRateLimit(`register:${ip}`, 3, 60 * 60 * 1000)) {
    return apiTooManyRequests('Too many registration attempts. Please try again later.')
  }

  const body = await req.json()
  const validation = validateBody(registerSchema, body)

  if (!validation.success) {
    return apiError((validation as any).error)
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
  } = validation.data as any

  // Check if email already exists
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return apiError('An account with this email already exists', 409)
  }

  // Generate credentials
  const registrationCode = generateRegistrationCode()

  // Generate email verification token
  const verifyToken = generateToken()
  const verifyTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  // Create user + profile in transaction
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email,
        registrationCode,
        registrationFee: config.fee,
        registrationCurrency: config.currency,
        programmeChoice: selectedProgramme,
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

    return newUser
  })

  // Send emails (non-blocking)
  sendEmailVerificationEmail(email, firstName, verifyToken).catch(console.error)
  sendRegistrationEmail(email, firstName, registrationCode).catch(console.error)

  // Audit log
  await createAuditLog({
    action: AuditAction.CREATE,
    entity: 'User',
    entityId: user.id,
    userId: user.id,
    details: { email },
    ipAddress: ip,
  })

  return apiCreated({
    registrationCode,
    message: 'Registration successful. Please check your email for instructions.',
  })
})
