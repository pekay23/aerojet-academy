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

    // Atomically consume the challenge to prevent replay race conditions
    const storedChallenge = await prisma.$transaction(async (tx) => {
      const challenge = await tx.passkeyChallenge.findFirst({
        where: {
          userId: session.user.id,
          type: 'registration',
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      })
      if (!challenge) return null
      await tx.passkeyChallenge.delete({ where: { id: challenge.id } })
      return challenge
    })

    if (!storedChallenge) {
      return new NextResponse('Challenge expired or not found. Please try again.', { status: 400 })
    }

    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: storedChallenge.challenge,
      expectedOrigin: rpConfig.origin as string[],
      expectedRPID: rpConfig.rpID,
      requireUserVerification: true,
    })

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json(
        { error: 'Verification failed. Ensure you are on the correct domain.' },
        { status: 400 }
      )
    }

    const {
      credential: cred,
      credentialDeviceType,
      credentialBackedUp,
    } = verification.registrationInfo

    // Count existing passkeys for auto-naming
    const existingCount = await prisma.passkey.count({
      where: { userId: session.user.id },
    })

    const passkeyName = name || `Passkey ${existingCount + 1}`

    // Store the credential — handle potential type edge cases
    const publicKeyBytes =
      cred.publicKey instanceof Uint8Array
        ? Buffer.from(cred.publicKey)
        : Buffer.from(cred.publicKey as unknown as ArrayBuffer)

    const passkey = await prisma.passkey.create({
      data: {
        userId: session.user.id,
        credentialId: cred.id,
        publicKey: publicKeyBytes,
        counter: BigInt(cred.counter ?? 0),
        deviceType: credentialDeviceType || 'singleDevice',
        backedUp: credentialBackedUp ?? false,
        transports: Array.isArray(credential.response?.transports)
          ? credential.response.transports
          : [],
        name: passkeyName,
      },
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
  } catch (error: unknown) {
    console.error('[PASSKEY_REGISTER_VERIFY]', error instanceof Error ? error?.message || error : 'Unknown error')
    return NextResponse.json(
      { error: 'Registration verification failed', detail: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
