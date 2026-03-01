import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma/client'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { verifyToken: token },
  })

  if (!user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  }

  if (user.verifyTokenExpires && user.verifyTokenExpires < new Date()) {
    return NextResponse.json({ error: 'Verification link has expired' }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date(),
      verifyToken: null,
    },
  })

  return NextResponse.json({
    success: true,
    message: 'Email verified successfully',
    hasPassword: !!user.password,
    role: user.role,
    status: user.status,
  })
}
