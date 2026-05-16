import { NextResponse } from 'next/server'
import { generateAuthenticationOptions } from '@simplewebauthn/server'
import { prismaBase as prisma } from '@/lib/prisma/db-base'
import { rpConfig } from '@/lib/auth/passkey-config'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const { email } = body

    let allowCredentials: { id: string; transports?: AuthenticatorTransport[] }[] = []
    let userId = null

    // If email is provided (email-first flow), we can scope to only their passkeys
    if (email) {
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          passkeys: { select: { credentialId: true, transports: true } },
        },
      })

      if (user) {
        userId = user.id
        allowCredentials = user.passkeys.map((pk) => ({
          id: pk.credentialId,
          transports: pk.transports as AuthenticatorTransport[],
        }))
      }
    }

    // Cleanup expired challenges
    await prisma.passkeyChallenge.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    })

    // If no email provided, or user not found, allowCredentials is []
    // This allows discoverable credentials (Conditional UI) to show all passkeys
    const options = await generateAuthenticationOptions({
      rpID: rpConfig.rpID,
      allowCredentials,
      userVerification: 'required',
    })

    await prisma.passkeyChallenge.create({
      data: {
        userId, // Might be null if discoverable credential flow
        challenge: options.challenge,
        type: 'authentication',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      },
    })

    return NextResponse.json({ options })
  } catch (error) {
    console.error('[PASSKEY_LOGIN_OPTIONS]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

type AuthenticatorTransport = 'ble' | 'cable' | 'hybrid' | 'internal' | 'nfc' | 'smart-card' | 'usb'
