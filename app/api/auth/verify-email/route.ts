import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma/client'
import { sendRegistrationEmail } from '@/lib/email/service'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { verifyToken: token },
    include: { profile: true },
  })

  if (!user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  }

  if (user.verifyTokenExpires && user.verifyTokenExpires < new Date()) {
    return NextResponse.json({ error: 'Verification link has expired' }, { status: 400 })
  }

  const wasNotVerified = !user.emailVerified

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date(),
      verifyToken: null,
    },
  })

  if (wasNotVerified) {
    const firstName = user.profile?.firstName || 'Student'
    sendRegistrationEmail(user.email, firstName, user.registrationCode).catch(console.error)
  }

  return NextResponse.json({
    success: true,
    message: 'Email verified successfully',
    hasPassword: !!user.password,
    role: user.role,
    status: user.status,
    registrationCode: user.registrationCode,
  })
}
