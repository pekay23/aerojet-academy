import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma/client'
import { logAuditEvent } from '@/lib/audit/logger'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { academyEmail: normalizedEmail },
          { personalEmail: normalizedEmail },
        ],
      },
      select: { id: true, email: true, marketingOptOut: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 })
    }

    if (user.marketingOptOut) {
      return NextResponse.json({ message: 'Already unsubscribed' })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { marketingOptOut: true },
    })

    await logAuditEvent({
      userId: user.id,
      action: 'SYSTEM',
      entity: 'User',
      entityId: user.id,
      description: `User ${user.email} unsubscribed from marketing emails`,
    })

    return NextResponse.json({ message: 'Successfully unsubscribed' })
  } catch (error) {
    console.error('[UNSUBSCRIBE_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
