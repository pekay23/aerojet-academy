import { NextResponse } from 'next/server'
import { Webhook } from 'svix'
import prisma from '@/lib/prisma/client'

/**
 * Resend Webhook Handler
 *
 * Receives events from Resend (sent, delivered, bounced, etc.)
 * and logs them to the AuditLog for tracking.
 * Verifies webhook signatures using Svix when RESEND_WEBHOOK_SECRET is configured.
 */
export async function POST(req: Request) {
  try {
    const body = await req.text()
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET

    let payload: any

    if (webhookSecret) {
      const svixId = req.headers.get('svix-id')
      const svixTimestamp = req.headers.get('svix-timestamp')
      const svixSignature = req.headers.get('svix-signature')

      if (!svixId || !svixTimestamp || !svixSignature) {
        return NextResponse.json({ error: 'Missing webhook signature headers' }, { status: 401 })
      }

      const wh = new Webhook(webhookSecret)
      try {
        payload = wh.verify(body, {
          'svix-id': svixId,
          'svix-timestamp': svixTimestamp,
          'svix-signature': svixSignature,
        })
      } catch {
        console.error('[Webhooks] Resend signature verification failed')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    } else {
      console.warn('[Webhooks] RESEND_WEBHOOK_SECRET not set — skipping signature verification')
      payload = JSON.parse(body)
    }

    const { type, data, created_at } = payload

    if (!type || !data) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

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

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Webhooks] Resend handler error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
