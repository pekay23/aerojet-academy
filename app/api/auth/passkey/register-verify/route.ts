import { NextResponse } from 'next/server'
import { verifyRegistrationResponse } from '@simplewebauthn/server'
import { getAuthSession } from '@/lib/auth/auth-options'
import { prismaBase as prisma } from '@/lib/prisma/db-base'
import { rpConfig } from '@/lib/auth/passkey-config'
import { createAuditLog } from '@/lib/audit/logger'

export async function POST(req: Request) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const { credential, name } = body

    if (!credential) {
      return new NextResponse('Missing credential', { status: 400 })
    }

    // Retrieve the stored challenge
    const storedChallenge = await prisma.passkeyChallenge.findFirst({
      where: {
        userId: session.user.id,
        type: 'registration',
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!storedChallenge) {
      return new NextResponse('Challenge expired or not found. Please try again.', { status: 400 })
    }

    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: storedChallenge.challenge,
      expectedOrigin: rpConfig.origin as string[],
      expectedRPID: rpConfig.rpID,
    })

    if (!verification.verified || !verification.registrationInfo) {
      return new NextResponse('Verification failed', { status: 400 })
    }

    const { credential: cred, credentialDeviceType, credentialBackedUp } = verification.registrationInfo

    // Count existing passkeys for auto-naming
    const existingCount = await prisma.passkey.count({
      where: { userId: session.user.id },
    })

    const passkeyName = name || `Passkey ${existingCount + 1}`

    // Store the credential
    const passkey = await prisma.passkey.create({
      data: {
        userId: session.user.id,
        credentialId: cred.id,
        publicKey: Buffer.from(cred.publicKey),
        counter: BigInt(cred.counter),
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
        transports: credential.response?.transports || [],
        name: passkeyName,
      },
    })

    // Delete used challenge
    await prisma.passkeyChallenge.delete({
      where: { id: storedChallenge.id },
    })

    await createAuditLog({
      action: 'PASSKEY_REGISTERED',
      entity: 'users',
      entityId: session.user.id,
      userId: session.user.id,
      description: `Registered passkey: ${passkeyName}`,
    })

    return NextResponse.json({
      success: true,
      passkeyId: passkey.id,
      name: passkeyName,
    })
  } catch (error) {
    console.error('[PASSKEY_REGISTER_VERIFY]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
