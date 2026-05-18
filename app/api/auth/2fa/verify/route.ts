import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/auth-options'
import { prismaBase as prisma } from '@/lib/prisma/db-base'
import { verifyTOTP } from '@/lib/auth/totp'
import { createAuditLog } from '@/lib/audit/logger'

export async function POST(req: Request) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const { token } = body

    if (!token) {
      return new NextResponse('Missing 2FA code', { status: 400 })
    }

    // Retrieve the pending secret from server-side storage — never accept from client
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { settings: true },
    })

    const settings = ((user?.settings as Record<string, unknown>) || {}) as Record<
      string,
      string | number | boolean
    >
    const secret = settings.pendingTwoFactorSecret as string | undefined
    if (!secret) {
      return new NextResponse('No pending 2FA setup found. Please generate a new QR code.', {
        status: 400,
      })
    }

    if (!verifyTOTP(token, secret)) {
      return new NextResponse('Invalid 2FA code', { status: 400 })
    }

    // Save the verified secret and enable 2FA, clear pending secret from settings
    const { pendingTwoFactorSecret: _, ...cleanSettings } = settings
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorSecret: secret,
        twoFactorEnabled: true,
        settings: cleanSettings as Record<string, string | number | boolean>,
      },
    })

    // Log the action
    await createAuditLog({
      action: 'ENABLE_2FA',
      entity: 'users',
      entityId: session.user.id,
      userId: session.user.id,
      description: 'User enabled Two-Factor Authentication',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[2FA_VERIFY]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
