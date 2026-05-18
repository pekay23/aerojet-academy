import { NextResponse } from 'next/server'
import { verifyAuthenticationResponse } from '@simplewebauthn/server'
import { prismaBase as prisma } from '@/lib/prisma/db-base'
import { rpConfig } from '@/lib/auth/passkey-config'
import crypto from 'crypto'
import { createAuditLog } from '@/lib/audit/logger'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { credential } = body

    if (!credential) {
      return new NextResponse('Missing credential', { status: 400 })
    }

    // Find the passkey
    const passkey = await prisma.passkey.findUnique({
      where: { credentialId: credential.id },
      include: { user: true },
    })

    if (!passkey || !passkey.user) {
      return new NextResponse('Passkey not found', { status: 401 })
    }

    // Find the challenge. Since it's authentication, we look up by challenge string
    // if userId is not tied in PasskeyChallenge. The client doesn't send the challenge directly
    // outside the response, but verifyAuthenticationResponse extracts it and checks.
    // Wait, verifyAuthenticationResponse needs the expectedChallenge to be provided.
    // The browser doesn't send the raw challenge in the JSON, it's signed inside clientDataJSON.
    // We must find the challenge that belongs to this user, OR we need the client to send the challenge ID.
    // Actually, SimpleWebAuthn's verifyAuthenticationResponse expects `expectedChallenge: string | ((challenge: string) => boolean)`.

    // Instead of passing a single string, we can look up ALL active auth challenges
    // for this user (or if null userId, any challenge) and see if one matches.
    // But it's easier to retrieve the challenge from DB based on the challenge string the client signed.
    // The clientDataJSON contains the challenge. It is Base64URL encoded.
    // We can extract it by parsing clientDataJSON.
    const clientDataJSON = Buffer.from(credential.response.clientDataJSON, 'base64').toString(
      'utf8'
    )
    const parsedClientData = JSON.parse(clientDataJSON)
    const signedChallenge = parsedClientData.challenge

    // Atomically consume the challenge to prevent replay race conditions
    const storedChallenge = await prisma.$transaction(async (tx) => {
      const challenge = await tx.passkeyChallenge.findUnique({
        where: { challenge: signedChallenge },
      })
      if (!challenge) return null
      await tx.passkeyChallenge.delete({ where: { id: challenge.id } })
      return challenge
    })

    if (
      !storedChallenge ||
      storedChallenge.type !== 'authentication' ||
      storedChallenge.expiresAt < new Date()
    ) {
      return new NextResponse('Challenge expired or not found', { status: 401 })
    }

    // Validate challenge-user binding:
    // - Email-scoped flow (userId set): must match the passkey owner
    // - Discoverable flow (userId null): any authenticated passkey is valid,
    //   security is provided by the cryptographic signature verification below
    if (storedChallenge.userId && storedChallenge.userId !== passkey.userId) {
      return new NextResponse('Challenge-user mismatch', { status: 401 })
    }

    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: storedChallenge.challenge,
      expectedOrigin: rpConfig.origin as string[],
      expectedRPID: rpConfig.rpID,
      credential: {
        id: passkey.credentialId,
        publicKey: passkey.publicKey,
        counter: Number(passkey.counter),
      },
      requireUserVerification: true,
    })

    if (!verification.verified || !verification.authenticationInfo) {
      return new NextResponse('Verification failed', { status: 401 })
    }

    const { newCounter } = verification.authenticationInfo

    // Update counter and last used
    await prisma.passkey.update({
      where: { id: passkey.id },
      data: {
        counter: BigInt(newCounter),
        lastUsedAt: new Date(),
      },
    })

    if (passkey.user.status !== 'ACTIVE') {
      return new NextResponse('Account is not active', { status: 403 })
    }

    // Generate a one-time token prefixed with 'pk_' for NextAuth bridge
    const bridgeToken = 'pk_' + crypto.randomBytes(32).toString('hex')
    const bridgeExpires = new Date(Date.now() + 60 * 1000) // 1 minute TTL

    await prisma.user.update({
      where: { id: passkey.user.id },
      data: {
        passkeyBridgeToken: bridgeToken,
        passkeyBridgeExpires: bridgeExpires,
      },
    })

    await createAuditLog({
      action: 'PASSKEY_LOGIN',
      entity: 'users',
      entityId: passkey.user.id,
      userId: passkey.user.id,
      description: `Logged in via passkey: ${passkey.name || 'Unknown'}`,
    })

    return NextResponse.json({ success: true, token: bridgeToken })
  } catch (error) {
    console.error('[PASSKEY_LOGIN_VERIFY]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
