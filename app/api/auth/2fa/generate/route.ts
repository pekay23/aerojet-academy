import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/auth-options'
import { prismaBase as prisma } from '@/lib/prisma/db-base'
import { generateSecret, generateURI } from 'otplib'
import QRCode from 'qrcode'

export async function POST() {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }

    // Generate a new secret
    const secret = generateSecret()

    // Generate the otpauth URL for QR Code
    const otpauthUrl = generateURI({
      secret,
      label: user.academyEmail || user.email,
      issuer: 'Aerojet Academy Staff',
      algorithm: 'sha1',
      digits: 6,
      period: 30,
    })

    // Generate QR code data URL
    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl)

    // Store the pending secret server-side in settings JSON — never trust client to send it back
    const currentSettings = ((user.settings as Record<string, unknown>) || {}) as Record<
      string,
      string | number | boolean
    >
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        settings: { ...currentSettings, pendingTwoFactorSecret: secret },
      },
    })

    // Return QR code URL only — secret is stored server-side for verification
    return NextResponse.json({
      qrCodeUrl,
    })
  } catch (error) {
    console.error('[2FA_GENERATE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
