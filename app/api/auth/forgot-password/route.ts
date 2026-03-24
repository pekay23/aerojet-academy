import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { sendPasswordResetEmail } from '@/lib/email/service'
import { generateToken } from '@/lib/auth/helpers'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'

export const POST = withErrorHandler(async (req: NextRequest) => {
  let body: any
  try {
    body = await req.json()
  } catch (e) {
    return apiError('Invalid request body', 400)
  }

  const { email } = body
  if (!email) {
    return apiError('Email is required', 400)
  }

  // Find user by either personal email or academy email
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { academyEmail: email }],
    },
    include: {
      profile: true,
    },
  })

  // Silently return success to prevent email enumeration
  if (!user) {
    return apiSuccess({ message: 'If an account exists, a reset link has been sent' })
  }

  // Generate a reset token valid for 1 hour
  const token = generateToken()
  const tokenExpires = new Date(Date.now() + 60 * 60 * 1000)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      verifyToken: token,
      verifyTokenExpires: tokenExpires,
    },
  })

  // Send the email to personal email (primary)
  const targetEmail = user.personalEmail || user.email
  await sendPasswordResetEmail(targetEmail, user.profile?.firstName || 'User', token).catch(
    console.error
  )

  await createAuditLog({
    action: AuditAction.UPDATE,
    entity: 'User',
    entityId: user.id,
    userId: user.id,
    description: 'Password reset link requested',
  })

  return apiSuccess({ message: 'If an account exists, a reset link has been sent' })
})
