import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/auth-options'
import { prismaBase as prisma } from '@/lib/prisma/db-base'
import { verify as verifyTotp } from 'otplib'
import { createAuditLog } from '@/lib/audit/logger'

export async function POST(req: Request) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const { token, secret } = body

    if (!token || !secret) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    // Verify the token against the provided secret
    const result = await verifyTotp({ token, secret })
    const isValid = result.valid

    if (!isValid) {
      return new NextResponse('Invalid 2FA code', { status: 400 })
    }

    // Save the secret to the user record and enable 2FA
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorSecret: secret,
        twoFactorEnabled: true
      }
    })

    // Log the action
    await createAuditLog({
      action: 'ENABLE_2FA',
      entity: 'users',
      entityId: session.user.id,
      userId: session.user.id,
      description: 'User enabled Two-Factor Authentication'
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[2FA_VERIFY]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
