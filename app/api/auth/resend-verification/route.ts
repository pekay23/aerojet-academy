import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma/client'
import { generateToken } from '@/lib/auth/helpers'
import { sendEmailVerificationEmail, sendActivationEmail } from '@/lib/email/service'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    })

    if (!user) {
      // For security, don't reveal if user exists
      return NextResponse.json({
        success: true,
        message: 'If an account exists, a new verification link has been sent.',
      })
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: 'Email is already verified' }, { status: 400 })
    }

    const verifyToken = generateToken()
    const verifyTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verifyToken,
        verifyTokenExpires,
      },
    })

    const firstName = user.profile?.firstName || 'User'

    if (user.password) {
      // Post-approval user: has credentials, send activation email
      await sendActivationEmail(
        user.email,
        firstName,
        user.academyEmail || user.email,
        '(use your existing password)',
        verifyToken
      )
    } else {
      // Pre-approval user: no credentials yet, send simple verification email
      await sendEmailVerificationEmail(user.email, firstName, verifyToken)
    }

    return NextResponse.json({ success: true, message: 'Verification link has been resent' })
  } catch (error) {
    console.error('[Resend Verification] Error:', error)
    return NextResponse.json({ error: 'Failed to resend verification link' }, { status: 500 })
  }
}
