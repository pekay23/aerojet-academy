import { NextResponse } from 'next/server'
import { generateRegistrationOptions } from '@simplewebauthn/server'
import { getAuthSession } from '@/lib/auth/auth-options'
import { prismaBase as prisma } from '@/lib/prisma/db-base'
import { rpConfig } from '@/lib/auth/passkey-config'

export async function POST() {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        profile: { select: { firstName: true, lastName: true } },
        passkeys: { select: { credentialId: true, transports: true } },
      },
    })

    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }

    // Cleanup expired challenges
    await prisma.passkeyChallenge.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    })

    const displayName = user.profile
      ? `${user.profile.firstName} ${user.profile.lastName}`
      : user.email

    const options = await generateRegistrationOptions({
      rpName: rpConfig.rpName,
      rpID: rpConfig.rpID,
      userName: user.academyEmail || user.email,
      userDisplayName: displayName,
      // Prevent re-registering existing credentials
      excludeCredentials: user.passkeys.map((pk) => ({
        id: pk.credentialId,
        transports: pk.transports as AuthenticatorTransport[],
      })),
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'required',
      },
      attestationType: 'none',
    })

    // Store challenge for verification
    await prisma.passkeyChallenge.create({
      data: {
        userId: session.user.id,
        challenge: options.challenge,
        type: 'registration',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      },
    })

    return NextResponse.json({ options })
  } catch (error) {
    console.error('[PASSKEY_REGISTER_OPTIONS]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

type AuthenticatorTransport = 'ble' | 'cable' | 'hybrid' | 'internal' | 'nfc' | 'smart-card' | 'usb'
