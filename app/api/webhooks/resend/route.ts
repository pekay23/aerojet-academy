import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'

/**
 * Resend Webhook Handler
 *
 * This endpoint receives events from Resend (sent, delivered, bounced, etc.)
 * and logs them to the AuditLog for tracking.
 */
export async function POST(req: Request) {
  try {
    const payload = await req.json()

    // Resend webhook payload structure:
    // {
    //   "type": "email.sent",
    //   "created_at": "2023-01-01T00:00:00.000Z",
    //   "data": { ... }
    // }
    const { type, data, created_at } = payload

    if (!type || !data) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Log the event to AuditLog
    // We prefix with EMAIL_ for easy filtering
    await prisma.auditLog.create({
      data: {
        action: `EMAIL_${type.replace('.', '_').toUpperCase()}`,
        entity: 'email',
        entityId: data.email_id || data.id || 'unknown',
        description: `Email event ${type} received from Resend at ${created_at}`,
        changes: {
          payload: payload,
          to: data.to,
          subject: data.subject,
        },
      },
    })

    // TODO: Add specific logic for 'email.bounced' or 'email.complained'
    // to flag user emails as invalid in the database.

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Webhooks] Resend handler error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
