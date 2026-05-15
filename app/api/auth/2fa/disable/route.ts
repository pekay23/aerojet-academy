import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/auth-options'
import { prismaBase as prisma } from '@/lib/prisma/db-base'
import { createAuditLog } from '@/lib/audit/logger'
import { verify as verifyTotp } from 'otplib'

export async function POST(req: Request) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const { token } = body

    if (!token) {
      return new NextResponse('Missing required 2FA code to disable', { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return new NextResponse('2FA is not enabled', { status: 400 })
    }

    // Require current valid 2FA token to disable
    const result = await verifyTotp({
      token,
      secret: user.twoFactorSecret
    })
    const isValid = result.valid

    if (!isValid) {
      return new NextResponse('Invalid 2FA code', { status: 400 })
    }

    // Disable 2FA
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorSecret: null,
        twoFactorEnabled: false
      }
    })

    // Log the action
    await createAuditLog({
      action: 'DISABLE_2FA',
      entity: 'users',
      entityId: session.user.id,
      userId: session.user.id,
      description: 'User disabled Two-Factor Authentication'
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[2FA_DISABLE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
