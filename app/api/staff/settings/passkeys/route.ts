import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/auth-options'
import { prismaBase as prisma } from '@/lib/prisma/db-base'

export async function GET() {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const passkeys = await prisma.passkey.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        name: true,
        deviceType: true,
        backedUp: true,
        createdAt: true,
        lastUsedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ passkeys })
  } catch (error) {
    console.error('[PASSKEYS_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
