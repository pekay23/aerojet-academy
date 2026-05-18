import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma/client'
import { logAuditEvent } from '@/lib/audit/logger'
import { rateLimit } from '@/lib/security/rate-limit'

export async function POST(req: Request) {
  try {
    // Rate limit by IP to prevent abuse
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown'
    const { allowed } = rateLimit(`unsubscribe:${ip}`, 5, 60 * 60 * 1000) // 5 per hour
    if (!allowed) {
      return NextResponse.json({ message: 'If subscribed, you have been unsubscribed.' })
    }

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

    // Uniform response regardless of whether user exists — prevents enumeration
    if (!user || user.marketingOptOut) {
      return NextResponse.json({ message: 'If subscribed, you have been unsubscribed.' })
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

    return NextResponse.json({ message: 'If subscribed, you have been unsubscribed.' })
  } catch (error) {
    console.error('[UNSUBSCRIBE_ERROR]', error)
    return NextResponse.json({ message: 'If subscribed, you have been unsubscribed.' })
  }
}
